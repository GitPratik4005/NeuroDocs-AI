"""
RAG service — retrieve relevant chunks from ChromaDB and generate answers via Ollama.
"""

import httpx

from core.config import settings
from services.embedding_service import generate_embedding
from pipelines.ingestion_pipeline import get_chroma_collection


def retrieve_relevant_chunks(
    question: str,
    user_id: str,
    n_results: int = 5,
    document_ids: list[str] | None = None,
) -> dict:
    """Embed the question and query ChromaDB for relevant chunks."""
    query_embedding = generate_embedding(question)
    collection = get_chroma_collection()

    where_filter = {"user_id": user_id}
    if document_ids:
        where_filter = {
            "$and": [
                {"user_id": user_id},
                {"document_id": {"$in": document_ids}},
            ]
        }

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    return results


def generate_answer(question: str, context_chunks: list[str]) -> str:
    """Call Ollama LLM to generate an answer based on retrieved context."""
    context = "\n\n---\n\n".join(context_chunks)

    prompt = f"""You are a helpful document assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information to answer, say so clearly.

Context:
{context}

Question: {question}

Answer:"""

    response = httpx.post(
        f"{settings.OLLAMA_BASE_URL}/api/chat",
        json={
            "model": settings.OLLAMA_LLM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
        },
        timeout=300.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["message"]["content"]
