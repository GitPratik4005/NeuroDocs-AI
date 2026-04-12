"""
Chunking service: splits extracted text into chunks for embedding.

Provides two strategies:
- chunk_text: naive fixed-size chunking with overlap (MVP fallback)
- smart_chunk: structure-aware chunking that respects headings and paragraphs
"""

import re

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
MIN_CHUNK_SIZE = 100

# Patterns that indicate a heading line
HEADING_PATTERNS = [
    re.compile(r"^#{1,6}\s+"),             # Markdown headings
    re.compile(r"^\d+\.(\d+\.?)*\s+\S"),    # Numbered sections (1. , 1.1 , 1.2.3 , etc.)
    re.compile(r"^[A-Z][A-Z\s]{2,}$"),     # ALL CAPS lines (3+ chars)
    re.compile(r"^--- Sheet:"),             # XLSX sheet headers from our extractor
]


def _is_heading(line: str) -> bool:
    """Check if a line looks like a heading."""
    stripped = line.strip()
    if not stripped or len(stripped) > 120:
        return False
    return any(p.match(stripped) for p in HEADING_PATTERNS)


def _split_at_sentences(text: str, max_size: int, overlap: int) -> list[str]:
    """Split text at sentence boundaries when it exceeds max_size."""
    if len(text) <= max_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + max_size, len(text))

        if end < len(text):
            # Try to find sentence boundary (period + space/newline)
            boundary = -1
            search_start = start + MIN_CHUNK_SIZE
            search_end = end

            while search_end > search_start:
                pos = text.rfind(".", search_start, search_end)
                if pos == -1:
                    break
                next_pos = pos + 1
                if next_pos >= len(text) or text[next_pos] in (" ", "\n", "\r"):
                    boundary = pos + 1
                    break
                search_end = pos

            if boundary == -1:
                boundary = text.rfind("\n", search_start, end)
            if boundary == -1:
                boundary = text.rfind(" ", search_start, end)
            if boundary > start + MIN_CHUNK_SIZE:
                end = boundary

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        next_start = end - overlap if end < len(text) else len(text)
        if next_start <= start:
            next_start = start + 1
        start = next_start

    return chunks


def smart_chunk(
    text: str,
    max_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Structure-aware chunking that respects headings and paragraphs.

    Strategy:
    1. Split text by double newlines (paragraph boundaries)
    2. Detect headings and keep them attached to following content
    3. Never split mid-paragraph unless it exceeds max_size
    4. Apply sentence-boundary splitting for oversized paragraphs
    5. Add overlap between chunks
    """
    if not text.strip():
        return []

    # Split into paragraphs (double newline boundaries)
    paragraphs = re.split(r"\n\s*\n", text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    if not paragraphs:
        return []

    chunks = []
    current_chunk = ""
    pending_heading = ""

    for para in paragraphs:
        if _is_heading(para):
            # If we have accumulated content, finalize it
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
                current_chunk = ""
            pending_heading = para
            continue

        # Prepend any pending heading to this paragraph
        if pending_heading:
            para = f"{pending_heading}\n{para}"
            pending_heading = ""

        # Check if adding this paragraph would exceed max_size
        tentative = f"{current_chunk}\n\n{para}" if current_chunk else para

        if len(tentative) <= max_size:
            current_chunk = tentative
        else:
            # Finalize current chunk if non-empty
            if current_chunk.strip():
                chunks.append(current_chunk.strip())

            # If the paragraph itself exceeds max_size, split at sentences
            if len(para) > max_size:
                sub_chunks = _split_at_sentences(para, max_size, overlap)
                chunks.extend(sub_chunks)
                current_chunk = ""
            else:
                current_chunk = para

    # Don't forget any remaining content
    if pending_heading:
        current_chunk = f"{current_chunk}\n\n{pending_heading}" if current_chunk else pending_heading
    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Filter out chunks below minimum size (unless it's the only chunk)
    if len(chunks) > 1:
        filtered = [c for c in chunks if len(c) >= MIN_CHUNK_SIZE]
        # If filtering removed everything, keep originals
        if filtered:
            chunks = filtered

    return chunks


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Naive fixed-size chunking with overlap (MVP fallback).
    Kept for backward compatibility and CSV row-based content.
    """
    if not text.strip():
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        if end < text_len:
            boundary = -1
            search_end = end
            while search_end > start + MIN_CHUNK_SIZE:
                pos = text.rfind(".", start + MIN_CHUNK_SIZE, search_end)
                if pos == -1:
                    break
                next_char_pos = pos + 1
                if next_char_pos >= text_len or text[next_char_pos] in (" ", "\n", "\r"):
                    boundary = pos
                    break
                search_end = pos

            if boundary == -1:
                boundary = text.rfind("\n", start + MIN_CHUNK_SIZE, end)
            if boundary == -1:
                boundary = text.rfind(" ", start + MIN_CHUNK_SIZE, end)
            if boundary > start + MIN_CHUNK_SIZE:
                end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        next_start = end - overlap if end < text_len else text_len
        if next_start <= start:
            next_start = start + 1
        start = next_start

    return chunks
