from embeddings import get_embedding
from vector_db import get_or_create_collection

def search_similar_chunks(query: str, top_k: int = 2, subject: str | None = None) -> list[dict]:
    """
    Retrieves the top_k most relevant chunks from ChromaDB,
    optionally filtering by subject metadata.
    """
    collection = get_or_create_collection()
    
    # 1. Convert user's question into a 768-dimensional embedding
    query_vector = get_embedding(query)
    
    # 2. Build metadata filter if a specific subject is requested
    where_filter = None
    if subject and subject.upper() != "ALL":
        where_filter = {"subject": subject.upper()}
    
    # 3. Query ChromaDB with optional metadata filtering
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )
    
    retrieved_items = []
    
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]
    
    for i in range(len(docs)):
        retrieved_items.append({
            "text": docs[i],
            "source": metas[i]["source"],
            "page_number": metas[i]["page_number"],
            "subject": metas[i].get("subject", "GENERAL"),
            "distance": round(distances[i], 4)
        })
        
    return retrieved_items

if __name__ == "__main__":
    # Test filtered search: ask for deadlock strictly inside DBMS (should yield no or fallback chunks)
    print("Testing filtered retrieval for subject 'DBMS'...")
    matches = search_similar_chunks("What are Coffman conditions?", top_k=2, subject="DBMS")
    print(f"Retrieved {len(matches)} chunks for DBMS filter.")
    for m in matches:
        print(f"[{m['subject']}] {m['source']} (Page {m['page_number']})")