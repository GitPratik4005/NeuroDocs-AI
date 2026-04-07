from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.query import QueryRecord
from pipelines.query_pipeline import run_query

router = APIRouter(prefix="/api/query", tags=["query"])


# --- Schemas ---

class QueryRequest(BaseModel):
    question: str
    document_ids: list[str] | None = None


class QueryResponse(BaseModel):
    id: str
    question: str
    answer: str
    source_chunks: list[str]
    document_ids: list[str]
    created_at: datetime


class QueryHistoryResponse(BaseModel):
    queries: list[QueryResponse]
    total: int
    page: int
    limit: int


# --- Routes ---

@router.post("", response_model=QueryResponse)
def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = run_query(db, current_user.id, request.question, request.document_ids)
    return result


@router.get("/history", response_model=QueryHistoryResponse)
def get_query_history(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(QueryRecord).filter(QueryRecord.user_id == current_user.id)
    total = query.count()
    records = query.order_by(QueryRecord.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    queries = []
    for r in records:
        queries.append(QueryResponse(
            id=r.id,
            question=r.question,
            answer=r.answer,
            source_chunks=r.get_source_chunks(),
            document_ids=r.get_document_ids(),
            created_at=r.created_at,
        ))

    return QueryHistoryResponse(queries=queries, total=total, page=page, limit=limit)
