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

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into chunks with overlap, respecting sentence boundaries."""
    if not text.strip():
        return []

    chunks = []
    start = 0
    text_len = len(text)
    min_chunk_size = 100  # avoid tiny chunks

    while start < text_len:
        end = min(start + chunk_size, text_len)

        if end < text_len:
            # Try to break at sentence-ending period (followed by space or newline)
            boundary = -1
            search_end = end
            while search_end > start + min_chunk_size:
                pos = text.rfind(".", start + min_chunk_size, search_end)
                if pos == -1:
                    break
                # Check if it's a real sentence boundary (followed by space, newline, or end)
                next_char_pos = pos + 1
                if next_char_pos >= text_len or text[next_char_pos] in (" ", "\n", "\r"):
                    boundary = pos
                    break
                search_end = pos

            if boundary == -1:
                # Fall back to newline break
                boundary = text.rfind("\n", start + min_chunk_size, end)
            if boundary == -1:
                # Fall back to space break
                boundary = text.rfind(" ", start + min_chunk_size, end)
            if boundary > start + min_chunk_size:
                end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Ensure start always moves forward
        next_start = end - overlap if end < text_len else text_len
        if next_start <= start:
            next_start = start + 1
        start = next_start

    return chunks


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

        # Step 2: Chunk text
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
