from pathlib import Path
from ingest import load_all_documents

def chunk_text(pages: list[dict], chunk_size: int = 1000, chunk_overlap: int = 100) -> list[dict]:
    """
    Splits extracted page text into overlapping chunks.
    Preserves document name, page number, and subject metadata.
    """
    chunks = []

    for page in pages:
        text = page["text"]
        source = page["source"]
        page_num = page["page_number"]
        subject = page.get("subject", "GENERAL")
        
        chunk_counter = 0
        start = 0
        text_length = len(text)
        
        # Slide through the page text with overlap
        while start < text_length:
            end = start + chunk_size
            chunk_content = text[start:end].strip()
            
            if chunk_content:
                chunks.append({
                    "chunk_id": f"{subject}_{source}_p{page_num}_c{chunk_counter}",
                    "source": source,
                    "page_number": page_num,
                    "subject": subject,
                    "text": chunk_content
                })
                chunk_counter += 1
                
            # Advance forward by chunk_size minus the overlap
            start += (chunk_size - chunk_overlap)
            
    return chunks

if __name__ == "__main__":
    # Test multi-document chunking across all folders
    all_pages = load_all_documents()
    all_chunks = chunk_text(all_pages)
    
    print(f"\n--- Created {len(all_chunks)} Chunks Across Knowledge Base ---")
    for ch in all_chunks[:4]:  # Preview the first 4 chunks
        print(f"\nID: {ch['chunk_id']}")
        print(f"Subject: {ch['subject']} | Source: {ch['source']} (Page {ch['page_number']})")
        print(f"Text Preview: {ch['text'][:90]}...")
        print("-" * 50)