"""
Query pipeline: retrieve relevant chunks → generate answer → save query record.
"""

import json

from sqlalchemy.orm import Session

from models.query import QueryRecord
from services.rag_service import hybrid_retrieve, generate_answer, generate_answer_stream


def run_query(
    db: Session,
    user_id: str,
    question: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Run the full RAG query pipeline."""
    # Step 1: Retrieve relevant chunks
    results = hybrid_retrieve(question, user_id, document_ids=document_ids)

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


def run_query_stream(
    db: Session,
    user_id: str,
    question: str,
    document_ids: list[str] | None = None,
):
    """Run RAG query pipeline with streaming answer generation. Yields SSE data chunks."""
    # Step 1: Retrieve relevant chunks
    results = hybrid_retrieve(question, user_id, document_ids=document_ids)

    context_chunks = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    chunk_ids = results["ids"][0] if results["ids"] else []

    if not context_chunks:
        no_result = "I couldn't find any relevant information in your documents to answer this question."
        yield f"data: {json.dumps({'type': 'token', 'content': no_result})}\n\n"
        # Save record
        record = QueryRecord(
            user_id=user_id,
            question=question,
            answer=no_result,
            source_chunks=json.dumps([]),
            document_ids=json.dumps([]),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        yield f"data: {json.dumps({'type': 'done', 'id': record.id})}\n\n"
        return

    doc_ids = list({m["document_id"] for m in metadatas})

    # Step 2: Stream answer tokens
    full_answer = []
    for token in generate_answer_stream(question, context_chunks):
        full_answer.append(token)
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    # Step 3: Save complete record
    answer = "".join(full_answer)
    record = QueryRecord(
        user_id=user_id,
        question=question,
        answer=answer,
        source_chunks=json.dumps(chunk_ids),
        document_ids=json.dumps(doc_ids),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    yield f"data: {json.dumps({'type': 'done', 'id': record.id})}\n\n"
