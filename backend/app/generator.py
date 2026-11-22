import os

import httpx
from retrieve import search_similar_chunks

OLLAMA_GEN_URL = "http://localhost:11434/api/generate"
GEN_MODEL = os.getenv("PREPMATE_GENERATION_MODEL") or "llama3.1:latest"

def generate_answer(query: str, top_k: int = 2, subject: str | None = None) -> dict:
    """
    Retrieves context from ChromaDB (with optional subject filter) and passes it
    to the configured generation model for an answer grounded in the study notes.
    """
    chunks = search_similar_chunks(query, top_k=top_k, subject=subject)
    
    if not chunks:
        return {
            "answer": f"No relevant study materials found in the knowledge base{' for ' + subject if subject else ''}.",
            "sources": []
        }
        
    context_blocks = []
    sources = []
    for chunk in chunks:
        context_blocks.append(
            f"[{chunk.get('subject', 'GENERAL')}] [Document: {chunk['source']}, Page {chunk['page_number']}]\n{chunk['text']}"
        )
        sources.append({
            "source": chunk["source"],
            "page_number": chunk["page_number"],
            "subject": chunk.get("subject", "GENERAL")
        })
        
    context_text = "\n\n".join(context_blocks)
    
    prompt = f"""You are PrepMate AI, an expert placement preparation tutor.
Answer the student's question clearly, thoroughly, and accurately using ONLY the provided context below.
If the answer cannot be determined from the context, state that the material is not in the notes.

CONTEXT:
{context_text}

STUDENT QUESTION:
{query}

ANSWER:"""

    payload = {
        "model": GEN_MODEL,
        "prompt": prompt,
        "stream": False
    }

    response = httpx.post(OLLAMA_GEN_URL, json=payload, timeout=120.0, trust_env=False)
    
    if response.status_code != 200:
        raise RuntimeError(f"Ollama generation failed: {response.status_code} - {response.text}")
        
    answer_text = response.json().get("response", "").strip()
    
    return {
        "answer": answer_text,
        "sources": sources
    }