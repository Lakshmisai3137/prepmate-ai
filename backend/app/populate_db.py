import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from ingest import load_all_documents
from chunking import chunk_text
from vector_db import add_chunks_to_db, get_or_create_collection

def populate_knowledge_base():
    print("=== PrepMate AI: Knowledge Base Ingestion ===")
    
    # 1. Discover and extract all PDFs across subject folders
    print("\n1. Scanning documents across all subject folders...")
    pages = load_all_documents("data/documents")
    print(f"   Total pages extracted: {len(pages)}")
    
    # 2. Chunk text with subject metadata
    print("\n2. Chunking text with metadata preservation...")
    chunks = chunk_text(pages, chunk_size=1000, chunk_overlap=100)
    print(f"   Total chunks generated: {len(chunks)}")
    
    # 3. Embed and store into ChromaDB in batches
    print("\n3. Generating embeddings & storing in ChromaDB...")
    if not chunks:
        raise ValueError("No indexable PDF text found in data/documents.")

    collection = get_or_create_collection()
    old_ids = set(collection.get(include=[])["ids"])
    add_chunks_to_db(chunks, batch_size=50)

    # Retire superseded chunks only after every new batch has been stored.
    stale_ids = sorted(old_ids.difference(chunk["chunk_id"] for chunk in chunks))
    for start in range(0, len(stale_ids), 500):
        collection.delete(ids=stale_ids[start : start + 500])
    
    # 4. Final verification
    print("\n=== Knowledge Base Population Complete ===")
    print(f"Total chunks indexed in ChromaDB: {collection.count()}")

if __name__ == "__main__":
    populate_knowledge_base()