"""
RAG service — retrieve relevant chunks from ChromaDB and generate answers via Ollama.
Supports hybrid retrieval (vector + BM25) with LLM-based reranking.
"""

import logging

import httpx

from core.config import settings
from services.embedding_service import generate_embedding
from services.keyword_search import bm25_search
from services.reranker import rerank
from pipelines.ingestion_pipeline import get_chroma_collection

logger = logging.getLogger(__name__)

# Reciprocal Rank Fusion constant
RRF_K = 60


def retrieve_relevant_chunks(
    question: str,
    user_id: str,
    n_results: int = 5,
    document_ids: list[str] | None = None,
) -> dict:
    """Embed the question and query ChromaDB for relevant chunks (vector-only, legacy)."""
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


def hybrid_retrieve(
    question: str,
    user_id: str,
    n_results: int = 5,
    document_ids: list[str] | None = None,
    use_reranking: bool = True,
) -> dict:
    """
    Hybrid retrieval: vector search + BM25 keyword search with RRF fusion.
    Optionally reranks results with LLM.
    """
    # Step 1: Vector search — get more candidates than needed
    vector_k = max(n_results * 4, 20)
    vector_results = retrieve_relevant_chunks(question, user_id, n_results=vector_k, document_ids=document_ids)

    vector_ids = vector_results["ids"][0] if vector_results["ids"] else []
    vector_docs = vector_results["documents"][0] if vector_results["documents"] else []
    vector_metas = vector_results["metadatas"][0] if vector_results["metadatas"] else []

    if not vector_ids:
        return vector_results  # nothing to fuse

    # Step 2: BM25 keyword search on the same chunk pool
    bm25_scores = bm25_search(question, vector_docs, vector_ids, top_k=vector_k)

    # Step 3: Reciprocal Rank Fusion
    # Build rank maps (1-based ranks)
    vector_ranks = {cid: rank + 1 for rank, cid in enumerate(vector_ids)}
    bm25_ranks = {cid: rank + 1 for rank, (cid, _) in enumerate(bm25_scores)}

    all_ids = set(vector_ids) | {cid for cid, _ in bm25_scores}
    fused_scores = {}
    for cid in all_ids:
        v_rank = vector_ranks.get(cid, vector_k + 1)
        b_rank = bm25_ranks.get(cid, vector_k + 1)
        fused_scores[cid] = 1.0 / (RRF_K + v_rank) + 1.0 / (RRF_K + b_rank)

    # Sort by fused score
    sorted_ids = sorted(fused_scores.keys(), key=lambda x: fused_scores[x], reverse=True)

    # Build id-to-data lookup
    id_to_doc = dict(zip(vector_ids, vector_docs))
    id_to_meta = dict(zip(vector_ids, vector_metas))

    # Get top candidates for reranking
    rerank_k = min(len(sorted_ids), n_results * 2)
    candidate_ids = sorted_ids[:rerank_k]
    candidate_docs = [id_to_doc[cid] for cid in candidate_ids if cid in id_to_doc]

    # Step 4: Optional LLM reranking
    if use_reranking and len(candidate_docs) > 1:
        reranked_docs = rerank(question, candidate_docs, top_k=n_results)
        # Map reranked docs back to ids
        doc_to_ids = {}
        for cid in candidate_ids:
            if cid in id_to_doc:
                doc_to_ids.setdefault(id_to_doc[cid], []).append(cid)

        final_ids = []
        final_docs = []
        final_metas = []
        for doc in reranked_docs:
            matching_ids = doc_to_ids.get(doc, [])
            for mid in matching_ids:
                if mid not in final_ids:
                    final_ids.append(mid)
                    final_docs.append(doc)
                    final_metas.append(id_to_meta.get(mid, {}))
                    break
    else:
        final_ids = [cid for cid in sorted_ids[:n_results] if cid in id_to_doc]
        final_docs = [id_to_doc[cid] for cid in final_ids]
        final_metas = [id_to_meta.get(cid, {}) for cid in final_ids]

    return {
        "ids": [final_ids],
        "documents": [final_docs],
        "metadatas": [final_metas],
    }


def _build_prompt(question: str, context_chunks: list[str]) -> str:
    """Build the RAG prompt from question and context."""
    context = "\n\n---\n\n".join(context_chunks)
    return f"""You are a helpful document assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information to answer, say so clearly.

Context:
{context}

Question: {question}

Answer:"""


def generate_answer(question: str, context_chunks: list[str]) -> str:
    """Call Ollama LLM to generate an answer (non-streaming)."""
    prompt = _build_prompt(question, context_chunks)

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


def generate_answer_stream(question: str, context_chunks: list[str]):
    """Call Ollama LLM and yield tokens as they stream in."""
    import json as _json

    prompt = _build_prompt(question, context_chunks)

    with httpx.stream(
        "POST",
        f"{settings.OLLAMA_BASE_URL}/api/chat",
        json={
            "model": settings.OLLAMA_LLM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        },
        timeout=300.0,
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line:
                continue
            data = _json.loads(line)
            content = data.get("message", {}).get("content", "")
            if content:
                yield content
            if data.get("done", False):
                break
