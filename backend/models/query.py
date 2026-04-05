import uuid
import json
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class QueryRecord(Base):
    __tablename__ = "queries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    source_chunks: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of chunk IDs
    document_ids: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of document IDs
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def get_source_chunks(self) -> list[str]:
        return json.loads(self.source_chunks)

    def get_document_ids(self) -> list[str]:
        return json.loads(self.document_ids)
