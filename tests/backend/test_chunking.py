"""Unit tests for text chunking logic."""

from pipelines.ingestion_pipeline import chunk_text


def test_empty_text_returns_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_short_text_single_chunk():
    text = "Hello world, this is a test."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_long_text_creates_multiple_chunks():
    text = "A" * 1200
    chunks = chunk_text(text, chunk_size=500, overlap=50)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c.strip()) > 0


def test_no_tiny_chunks():
    """Non-final chunks should not be very small."""
    sentences = ["This is a complete sentence with enough words. " for _ in range(50)]
    text = "".join(sentences)
    chunks = chunk_text(text, chunk_size=500, overlap=50)
    for chunk in chunks[:-1]:
        assert len(chunk) >= 50, f"Chunk too small: '{chunk}'"


def test_preserves_all_content():
    """All key content should appear in the chunks."""
    text = "The quick brown fox jumps over the lazy dog. " * 30
    chunks = chunk_text(text, chunk_size=200, overlap=50)
    all_text = " ".join(chunks)
    assert "quick brown fox" in all_text
    assert "lazy dog" in all_text
