import fitz

pdf_path = input("Enter the full path of your PDF: ").strip().strip('"')

try:
    doc = fitz.open(pdf_path)

    print("Total pages:", len(doc))
    total_chars = 0

    for page_number, page in enumerate(doc, start=1):
        text = page.get_text("text")
        total_chars += len(text.strip())

        print(
            f"Page {page_number}: "
            f"{len(text.strip())} extracted characters"
        )

        if page_number == 1:
            print("\nFirst-page text preview:")
            print(text[:500] or "[No selectable text found]")

    print("\nTotal extracted characters:", total_chars)

    if total_chars == 0:
        print("RESULT: This PDF may need OCR.")
    else:
        print("RESULT: Text extraction is working.")

    doc.close()

except Exception as exc:
    print("PDF inspection failed:", repr(exc))