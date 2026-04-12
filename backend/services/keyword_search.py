"""
BM25 keyword search service for hybrid retrieval.
Builds an in-memory BM25 index from chunk texts and scores them against a query.
"""

import re
from rank_bm25 import BM25Okapi


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer with lowercasing."""
    return re.findall(r"\w+", text.lower())


def bm25_search(
    query: str,
    chunks: list[str],
    chunk_ids: list[str],
    top_k: int = 20,
) -> list[tuple[str, float]]:
    """
    Run BM25 keyword search over chunk texts.

    Returns list of (chunk_id, score) sorted by score descending.
    """
    if not chunks or not query.strip():
        return []

    tokenized_corpus = [_tokenize(chunk) for chunk in chunks]
    bm25 = BM25Okapi(tokenized_corpus)

    tokenized_query = _tokenize(query)
    scores = bm25.get_scores(tokenized_query)

    # Pair with chunk_ids and sort by score
    scored = [(chunk_ids[i], float(scores[i])) for i in range(len(chunk_ids))]
    scored.sort(key=lambda x: x[1], reverse=True)

    return scored[:top_k]
