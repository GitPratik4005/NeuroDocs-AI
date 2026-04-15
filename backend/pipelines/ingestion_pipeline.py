"""
Ingestion pipeline: extract text → chunk → embed → store in PostgreSQL + ChromaDB.
"""

import chromadb
from sqlalchemy.orm import Session

from core.config import settings
from models.chunk import Chunk
from models.document import Document
from services.ocr_service import extract_text
from services.embedding_service import generate_embeddings
from services.chunking_service import smart_chunk, chunk_text

# File types that benefit from structure-aware chunking
STRUCTURED_FILE_TYPES = {"pdf", "docx"}
# File types that work better with naive chunking (row-based content)
FLAT_FILE_TYPES = {"csv", "xlsx"}


def get_chroma_collection():
    """Get or create the ChromaDB collection."""
    client = chromadb.PersistentClient(path="./chroma_data")
    return client.get_or_create_collection(name="neurodocai")


def run_ingestion(db: Session, document_id: str) -> None:
    """Run the full ingestion pipeline for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    try:
        # Step 1: Extract text
        text = extract_text(doc.file_path, doc.file_type)
        if not text.strip():
            doc.status = "failed"
            db.commit()
            return

        # Step 2: Chunk text (smart for structured docs, naive for flat files)
        if doc.file_type in STRUCTURED_FILE_TYPES:
            chunks = smart_chunk(text)
        else:
            chunks = chunk_text(text)
        if not chunks:
            doc.status = "failed"
            db.commit()
            return

        # Step 3: Generate embeddings
        embeddings = generate_embeddings(chunks)

        # Step 4: Store in ChromaDB
        collection = get_chroma_collection()
        chunk_ids = []
        for i, (chunk_text_content, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_obj = Chunk(
                document_id=doc.id,
                content=chunk_text_content,
                chunk_index=i,
            )
            db.add(chunk_obj)
            db.flush()  # get the chunk id
            chunk_ids.append(chunk_obj.id)

            collection.add(
                ids=[chunk_obj.id],
                embeddings=[embedding],
                documents=[chunk_text_content],
                metadatas=[{
                    "document_id": doc.id,
                    "user_id": doc.user_id,
                    "chunk_index": i,
                }],
            )
            chunk_obj.embedding_id = chunk_obj.id

        # Step 5: Update document status
        doc.status = "ready"
        doc.chunk_count = len(chunks)
        db.commit()

    except Exception:
        doc.status = "failed"
        db.commit()
        raise
