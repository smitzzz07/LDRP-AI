


from pathlib import Path
import json
import numpy as np
import faiss


# ==================================================
# PROJECT PATHS
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "embeddings.json"
)

VECTOR_DB_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "faiss.index"
)


# ==================================================
# MAIN
# ==================================================

def main():

    print("=" * 60)
    print("       LDRP RAG - VECTOR STORE")
    print("=" * 60)


    # ==================================================
    # CHECK INPUT FILE
    # ==================================================

    if not INPUT_PATH.exists():

        print("[ERROR] embeddings.json not found!")

        print(
            f"Expected location:\n{INPUT_PATH}"
        )

        return


    # ==================================================
    # LOAD EMBEDDINGS
    # ==================================================

    print("\n[DATA] Loading embeddings...")

    with open(
        INPUT_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        chunks = json.load(file)


    print(
        f"[OK] Loaded {len(chunks)} chunks"
    )


    # ==================================================
    # CHECK EMPTY DATA
    # ==================================================

    if not chunks:

        print("[ERROR] No chunks found!")

        return


    # ==================================================
    # EXTRACT EMBEDDINGS
    # ==================================================

    print(
        "\n[NUM] Converting embeddings to NumPy..."
    )

    embeddings = np.array(
        [
            chunk["embedding"]
            for chunk in chunks
        ],
        dtype="float32"
    )


    print(
        f"Embedding shape: {embeddings.shape}"
    )


    # ==================================================
    # VALIDATE EMBEDDING SHAPE
    # ==================================================

    if len(embeddings.shape) != 2:

        raise ValueError(
            "Embeddings must be a 2D array."
        )


    number_of_vectors = embeddings.shape[0]
    dimension = embeddings.shape[1]


    if number_of_vectors != len(chunks):

        raise ValueError(
            "Number of embeddings does not "
            "match number of chunks."
        )


    print(
        f"[OK] Number of vectors: {number_of_vectors}"
    )

    print(
        f"[OK] Vector dimension: {dimension}"
    )


    # ==================================================
    # CREATE FAISS INDEX
    # ==================================================

    print(
        "\n[SEARCH] Creating FAISS IndexFlatL2..."
    )

    index = faiss.IndexFlatL2(
        dimension
    )


    # ==================================================
    # ADD VECTORS
    # ==================================================

    print(
        "[INPUT] Adding vectors to FAISS..."
    )

    index.add(
        embeddings
    )


    print(
        f"[OK] FAISS vectors: {index.ntotal}"
    )


    # ==================================================
    # VALIDATE INDEX
    # ==================================================

    if index.ntotal != len(chunks):

        raise ValueError(
            "FAISS vector count does not "
            "match chunk count."
        )


    # ==================================================
    # SAVE INDEX
    # ==================================================

    VECTOR_DB_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    faiss.write_index(
        index,
        str(VECTOR_DB_PATH)
    )


    # ==================================================
    # FINAL SUMMARY
    # ==================================================

    print(
        "\n" + "=" * 60
    )

    print(
        "       FAISS BUILD SUCCESSFUL"
    )

    print(
        "=" * 60
    )

    print(
        f"[DATA] Chunks:       {len(chunks)}"
    )

    print(
        f"[MODEL] Vectors:      {index.ntotal}"
    )

    print(
        f"[DIM] Dimensions:   {dimension}"
    )

    print(
        "[SEARCH] Index type:   IndexFlatL2"
    )

    print(
        f"\n[DIR] Saved to:\n{VECTOR_DB_PATH}"
    )

    print(
        "\n[OK] Vector database is ready!"
    )


# ==================================================
# RUN
# ==================================================

if __name__ == "__main__":

    main()