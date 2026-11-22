import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from pathlib import Path
import chromadb
from chromadb.config import Settings
from embeddings import get_batch_embeddings

DB_PATH = Path("data/chroma_db")
COLLECTION_NAME = "prepmate_notes"

def get_chroma_client():
    """Initializes and returns a persistent ChromaDB client."""
    DB_PATH.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(DB_PATH),
        settings=Settings(anonymized_telemetry=False)
    )

def get_or_create_collection():
    """Retrieves or creates our main document collection in ChromaDB."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

def add_chunks_to_db(chunks: list[dict], batch_size: int = 50):
    """
    Embeds and saves chunks into ChromaDB using vectorized batch requests.
    """
    collection = get_or_create_collection()
    total_chunks = len(chunks)
    print(f"Indexing {total_chunks} chunks into ChromaDB (batch size: {batch_size})...")

    for i in range(0, total_chunks, batch_size):
        batch = chunks[i : i + batch_size]

        ids = [chunk["chunk_id"] for chunk in batch]
        documents = [chunk["text"] for chunk in batch]
        metadatas = [
            {
                "source": chunk["source"],
                "page_number": chunk["page_number"],
                "subject": chunk.get("subject", "GENERAL")
            }
            for chunk in batch
        ]

        # Generate all 50 vectors in a single call to Ollama
        embeddings = get_batch_embeddings(documents)

        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings
        )

        processed = min(i + batch_size, total_chunks)
        print(f"  -> Indexed [{processed}/{total_chunks}] chunks...")

    print("All chunks successfully saved and indexed!")

if __name__ == "__main__":
    col = get_or_create_collection()
    print("--- ChromaDB Collection Status ---")
    print(f"Storage Path: {DB_PATH.resolve()}")
    print(f"Collection Name: {col.name}")
    print(f"Current Records Count: {col.count()}")