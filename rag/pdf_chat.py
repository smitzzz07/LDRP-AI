import os
import uuid

import fitz
import faiss
import numpy as np

from sentence_transformers import SentenceTransformer


UPLOAD_DIR = os.path.join(
    "data",
    "uploads"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

MODEL_NAME = "all-MiniLM-L6-v2"

_embedding_model = None

_uploaded_documents = {}


def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        print("Loading PDF embedding model...")

        _embedding_model = SentenceTransformer(
            MODEL_NAME
        )

        print(
            "✅ PDF embedding model loaded"
        )

    return _embedding_model


def extract_pdf_text(pdf_path):
    document = fitz.open(pdf_path)

    pages = []

    for page_number, page in enumerate(
        document,
        start=1
    ):
        text = page.get_text("text")

        if text and text.strip():
            pages.append(
                {
                    "page": page_number,
                    "text": text.strip(),
                }
            )

    document.close()

    return pages


def create_chunks(
    pages,
    chunk_size=1000,
    overlap=150
):
    chunks = []

    for page_data in pages:

        text = page_data["text"]
        page_number = page_data["page"]

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk_text = text[
                start:end
            ].strip()

            if chunk_text:
                chunks.append(
                    {
                        "text": chunk_text,
                        "page": page_number,
                    }
                )

            start += (
                chunk_size - overlap
            )

    return chunks


def process_pdf(pdf_path):

    pages = extract_pdf_text(
        pdf_path
    )

    if not pages:
        raise ValueError(
            "No readable text was found in this PDF."
        )

    chunks = create_chunks(
        pages
    )

    if not chunks:
        raise ValueError(
            "No text chunks could be created from this PDF."
        )

    model = get_embedding_model()

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    embeddings = model.encode(
        texts,
        convert_to_numpy=True
    ).astype("float32")

    index = faiss.IndexFlatL2(
        embeddings.shape[1]
    )

    index.add(
        embeddings
    )

    document_id = str(
        uuid.uuid4()
    )

    _uploaded_documents[
        document_id
    ] = {
        "chunks": chunks,
        "index": index,
        "filename": os.path.basename(
            pdf_path
        ),
    }

    return {
        "document_id": document_id,
        "filename": os.path.basename(
            pdf_path
        ),
        "pages": len(pages),
        "chunks": len(chunks),
    }


def search_uploaded_pdf(
    document_id,
    question,
    top_k=5
):

    document = _uploaded_documents.get(
        document_id
    )

    if not document:
        raise ValueError(
            "Uploaded PDF session not found. Please upload the PDF again."
        )

    model = get_embedding_model()

    question_embedding = model.encode(
        [question],
        convert_to_numpy=True
    ).astype("float32")

    total_vectors = (
        document["index"].ntotal
    )

    if total_vectors == 0:
        return []

    search_k = min(
        top_k,
        total_vectors
    )

    distances, indices = (
        document["index"].search(
            question_embedding,
            search_k
        )
    )

    results = []

    for distance, index in zip(
        distances[0],
        indices[0]
    ):

        if index < 0:
            continue

        chunk = document[
            "chunks"
        ][index]

        results.append(
            {
                "text": chunk["text"],
                "page": chunk["page"],
                "distance": float(
                    distance
                ),
            }
        )

    return results