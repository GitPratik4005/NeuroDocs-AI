"""
LLM-based reranker — uses Ollama to rerank retrieved chunks by relevance.
Falls back to original order if LLM reranking fails.
"""

import re
import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

RERANK_PROMPT = """You are a relevance judge. Given a question and a list of text passages, rank the passages by how relevant they are to answering the question.

Question: {question}

Passages:
{passages}

Return ONLY a comma-separated list of passage numbers in order from most relevant to least relevant. Example: 2,1,4,3,5
Do not include any other text."""


def rerank(
    query: str,
    chunks: list[str],
    top_k: int = 5,
) -> list[str]:
    """
    Rerank chunks using LLM. Returns reordered chunks (most relevant first).
    Falls back to original order on failure.
    """
    if not chunks or len(chunks) <= 1:
        return chunks[:top_k]

    # Build numbered passage list
    passages = "\n\n".join(
        f"[{i + 1}] {chunk[:300]}" for i, chunk in enumerate(chunks)
    )

    prompt = RERANK_PROMPT.format(question=query, passages=passages)

    try:
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": settings.OLLAMA_LLM_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
            timeout=120.0,
        )
        response.raise_for_status()

        content = response.json()["message"]["content"].strip()
        indices = _parse_ranking(content, len(chunks))

        if indices:
            reranked = [chunks[i] for i in indices]
            return reranked[:top_k]

    except Exception as e:
        logger.warning(f"LLM reranking failed, using original order: {e}")

    return chunks[:top_k]


def _parse_ranking(response: str, num_chunks: int) -> list[int]:
    """Parse the LLM's ranking response into 0-based indices."""
    # Extract all numbers from the response
    numbers = re.findall(r"\d+", response)

    indices = []
    seen = set()
    for num_str in numbers:
        idx = int(num_str) - 1  # Convert 1-based to 0-based
        if 0 <= idx < num_chunks and idx not in seen:
            indices.append(idx)
            seen.add(idx)

    return indices if indices else []
