"""Conversations API — CRUD for persistent chat sessions."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.document import Document
from models.conversation import Conversation, ConversationMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# --- Schemas ---

class ConversationCreate(BaseModel):
    document_id: str
    title: str | None = None


class MessageCreate(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    document_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]
    total: int


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int


# --- Routes ---

@router.get("", response_model=ConversationListResponse)
def list_conversations(
    doc_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List conversations for the current user, optionally filtered by document."""
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if doc_id:
        query = query.filter(Conversation.document_id == doc_id)

    total = query.count()
    conversations = query.order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        msg_count = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conv.id
        ).count()
        result.append(ConversationResponse(
            id=conv.id,
            document_id=conv.document_id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=msg_count,
        ))

    return ConversationListResponse(conversations=result, total=total)


@router.post("", response_model=ConversationResponse, status_code=201)
def create_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new conversation for a document."""
    doc = db.query(Document).filter(
        Document.id == body.document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    conv = Conversation(
        user_id=current_user.id,
        document_id=body.document_id,
        title=body.title or f"Chat — {doc.title}",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        document_id=conv.document_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0,
    )


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
def get_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages for a conversation."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.created_at.asc()).all()

    return MessageListResponse(
        messages=[MessageResponse.model_validate(m) for m in messages],
        total=len(messages),
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
def add_message(
    conversation_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a message to a conversation."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if body.role not in ("user", "assistant"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'assistant'")

    msg = ConversationMessage(
        conversation_id=conversation_id,
        role=body.role,
        content=body.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return msg


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation and its messages."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).delete()
    db.delete(conv)
    db.commit()
