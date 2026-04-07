"""
Query pipeline: retrieve relevant chunks → generate answer → save query record.
"""

import json

from sqlalchemy.orm import Session

from models.query import QueryRecord
from services.rag_service import retrieve_relevant_chunks, generate_answer


def run_query(
    db: Session,
    user_id: str,
    question: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Run the full RAG query pipeline."""
    # Step 1: Retrieve relevant chunks
    results = retrieve_relevant_chunks(question, user_id, document_ids=document_ids)

    context_chunks = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    chunk_ids = results["ids"][0] if results["ids"] else []

    if not context_chunks:
        answer = "I couldn't find any relevant information in your documents to answer this question."
        source_chunk_ids = []
        doc_ids = []
    else:
        # Step 2: Generate answer
        answer = generate_answer(question, context_chunks)
        source_chunk_ids = chunk_ids
        doc_ids = list({m["document_id"] for m in metadatas})

    # Step 3: Save query record
    record = QueryRecord(
        user_id=user_id,
        question=question,
        answer=answer,
        source_chunks=json.dumps(source_chunk_ids),
        document_ids=json.dumps(doc_ids),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "question": question,
        "answer": answer,
        "source_chunks": source_chunk_ids,
        "document_ids": doc_ids,
        "created_at": record.created_at,
    }
