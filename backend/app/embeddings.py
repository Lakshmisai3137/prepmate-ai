import httpx

# Ollama local API endpoints
OLLAMA_EMBED_URL = "http://localhost:11434/api/embed"
EMBED_MODEL = "nomic-embed-text"

def get_embedding(text: str) -> list[float]:
    """
    Generates an embedding for a single text string (used during user queries).
    """
    embeddings = get_batch_embeddings([text])
    return embeddings[0]

def get_batch_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Sends a batch of text strings to Ollama in a single HTTP request.
    Dramatically accelerates document indexing.
    """
    if not texts:
        return []

    payload = {
        "model": EMBED_MODEL,
        "input": texts
    }

    # Increased timeout to allow batch computation
    response = httpx.post(OLLAMA_EMBED_URL, json=payload, timeout=120.0, trust_env=False)

    if response.status_code != 200:
        raise RuntimeError(f"Ollama batch embedding failed with code {response.status_code}: {response.text}")

    data = response.json()
    return data["embeddings"]

if __name__ == "__main__":
    sample_batch = [
        "A process has its own memory space.",
        "Threads share the process memory space.",
        "Deadlock occurs when processes hold resources and wait for others."
    ]

    print(f"Testing batch embedding with {len(sample_batch)} sentences...")
    vectors = get_batch_embeddings(sample_batch)
    print(f"Successfully generated {len(vectors)} vectors in one network call!")
    print(f"Dimensions of vector 1: {len(vectors[0])}")