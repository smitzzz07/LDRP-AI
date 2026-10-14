import os
import uuid
from pathlib import Path

import fitz  # PyMuPDF
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageOps
    from io import BytesIO
except ImportError:
    pytesseract = None
    Image = None
    ImageEnhance = None
    ImageOps = None
    BytesIO = None


# Resolve paths relative to the project root, not the terminal's current folder.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "all-MiniLM-L6-v2"
_embedding_model = None
_uploaded_documents = {}


def configure_tesseract():
    """Find Tesseract on Windows and configure pytesseract if needed."""
    if pytesseract is None:
        return False

    # If Tesseract is already on PATH, pytesseract can use it directly.
    from shutil import which

    discovered = which("tesseract")
    if discovered:
        pytesseract.pytesseract.tesseract_cmd = discovered
        return True

    # Common Windows install locations, including per-user installations.
    candidates = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Tesseract-OCR" / "tesseract.exe",
        Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Tesseract-OCR" / "tesseract.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")) / "Tesseract-OCR" / "tesseract.exe",
    ]

    for candidate in candidates:
        if candidate.is_file():
            pytesseract.pytesseract.tesseract_cmd = str(candidate)
            return True

    return False


def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        print("Loading PDF embedding model...")
        _embedding_model = SentenceTransformer(MODEL_NAME)
        print("PDF embedding model loaded")

    return _embedding_model


def _ocr_page(page):
    """OCR one PDF page image with image enhancement for scanned documents."""
    if pytesseract is None or Image is None or BytesIO is None:
        raise RuntimeError(
            "This PDF appears to be scanned, but Python OCR packages are missing. "
            "Run: python -m pip install pytesseract Pillow"
        )

    if not configure_tesseract():
        raise RuntimeError(
            "This PDF appears to be scanned, but the Tesseract executable was not found. "
            "Install Tesseract OCR or configure its path in rag/pdf_chat.py."
        )

    # Render at high resolution to improve recognition of small text and marks.
    pixmap = page.get_pixmap(matrix=fitz.Matrix(3.5, 3.5), alpha=False)
    image = Image.open(BytesIO(pixmap.tobytes("png"))).convert("RGB")

    try:
        # Crop away large dark margins sometimes found in scanned PDFs.
        gray = ImageOps.grayscale(image)
        mask = gray.point(lambda pixel: 255 if pixel > 45 else 0)
        bbox = mask.getbbox()

        if bbox:
            left, top, right, bottom = bbox
            pad = 20
            bbox = (
                max(0, left - pad),
                max(0, top - pad),
                min(image.width, right + pad),
                min(image.height, bottom + pad),
            )
            cropped = image.crop(bbox)
            image.close()
            image = cropped

        processed = ImageOps.grayscale(image)
        processed = ImageOps.autocontrast(processed)
        processed = ImageEnhance.Contrast(processed).enhance(1.5)

        try:
            return pytesseract.image_to_string(
                processed,
                lang="eng",
                config="--psm 6",
            ).strip()
        except pytesseract.TesseractNotFoundError as exc:
            raise RuntimeError(
                "Tesseract OCR could not be launched. Check the Tesseract installation path."
            ) from exc
        except pytesseract.TesseractError as exc:
            raise RuntimeError(
                "Tesseract OCR failed. Check that English language data (eng) is installed."
            ) from exc
        finally:
            processed.close()
    finally:
        image.close()


def extract_pdf_text(pdf_path):
    """Extract selectable PDF text first; OCR pages that have little/no text."""
    pages = []

    with fitz.open(pdf_path) as document:
        total_pages = len(document)
        print(f"Reading PDF: {Path(pdf_path).name} ({total_pages} pages)")

        for page_number, page in enumerate(document, start=1):
            text = (page.get_text("text") or "").strip()

            # Scanned pages usually return no text. A low character count can
            # also indicate a page that is mostly an image.
            if len(text) < 30:
                try:
                    ocr_text = _ocr_page(page)
                    if len(ocr_text) > len(text):
                        text = ocr_text
                    print(
                        f"Page {page_number}/{total_pages}: OCR "
                        f"({'text found' if text else 'no text found'})"
                    )
                except RuntimeError:
                    # If selectable text exists, preserve it even if OCR is
                    # unavailable. If no text exists, surface the OCR error.
                    if not text:
                        raise

            if text:
                pages.append({"page": page_number, "text": text})

    return pages


def create_chunks(pages, chunk_size=1000, overlap=150):
    chunks = []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be between zero and chunk_size - 1.")

    step = chunk_size - overlap

    for page_data in pages:
        text = page_data["text"]
        page_number = page_data["page"]

        for start in range(0, len(text), step):
            chunk_text = text[start:start + chunk_size].strip()
            if chunk_text:
                chunks.append({"text": chunk_text, "page": page_number})

    return chunks


def process_pdf(pdf_path):
    pages = extract_pdf_text(pdf_path)

    if not pages:
        raise ValueError(
            "No readable text was found in this PDF, even after OCR. "
            "The PDF may be blank, protected, or too low quality."
        )

    chunks = create_chunks(pages)
    if not chunks:
        raise ValueError("No text chunks could be created from this PDF.")

    model = get_embedding_model()
    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype("float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    document_id = str(uuid.uuid4())
    filename = os.path.basename(pdf_path)

    _uploaded_documents[document_id] = {
        "chunks": chunks,
        "index": index,
        "filename": filename,
    }

    print(
        f"PDF processed successfully: {filename}; "
        f"pages with text={len(pages)}; chunks={len(chunks)}"
    )

    return {
        "document_id": document_id,
        "filename": filename,
        "pages": len(pages),
        "chunks": len(chunks),
    }


def search_uploaded_pdf(document_id, question, top_k=5):
    document = _uploaded_documents.get(document_id)

    if not document:
        raise ValueError(
            "Uploaded PDF session not found. Please upload the PDF again."
        )

    model = get_embedding_model()
    question_embedding = model.encode(
        [question],
        convert_to_numpy=True,
    ).astype("float32")

    total_vectors = document["index"].ntotal
    if total_vectors == 0:
        return []

    search_k = min(top_k, total_vectors)
    distances, indices = document["index"].search(question_embedding, search_k)

    results = []
    for distance, chunk_index in zip(distances[0], indices[0]):
        if chunk_index < 0:
            continue

        chunk = document["chunks"][int(chunk_index)]
        results.append({
            "text": chunk["text"],
            "page": chunk["page"],
            "distance": float(distance),
        })

    return results
