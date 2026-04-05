"""
Embedding service — calls Ollama's nomic-embed-text model via HTTP.
"""

import httpx

from core.config import settings

OLLAMA_EMBED_URL = f"{settings.OLLAMA_BASE_URL}/api/embed"


def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector for a single text string."""
    response = httpx.post(
        OLLAMA_EMBED_URL,
        json={"model": settings.OLLAMA_EMBEDDING_MODEL, "input": text},
        timeout=60.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["embeddings"][0]


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts in a single request."""
    response = httpx.post(
        OLLAMA_EMBED_URL,
        json={"model": settings.OLLAMA_EMBEDDING_MODEL, "input": texts},
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["embeddings"]
