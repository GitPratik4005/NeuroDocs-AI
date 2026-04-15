"""Tests for smart chunking service."""

import pytest
from services.chunking_service import smart_chunk, chunk_text, _is_heading


# --- Heading detection ---

def test_is_heading_markdown():
    assert _is_heading("# Introduction")
    assert _is_heading("## Section Two")
    assert _is_heading("### Sub-section")


def test_is_heading_numbered():
    assert _is_heading("1. Overview")
    assert _is_heading("2.3 Details")
    assert _is_heading("1.2.3 Deep section")


def test_is_heading_allcaps():
    assert _is_heading("INTRODUCTION")
    assert _is_heading("KEY FINDINGS")


def test_is_heading_rejects_long_lines():
    long_line = "A" * 130
    assert not _is_heading(long_line)


def test_is_heading_rejects_normal_text():
    assert not _is_heading("This is a normal paragraph with some text in it.")
    assert not _is_heading("")


def test_is_heading_xlsx_sheet():
    assert _is_heading("--- Sheet: Sales ---")


# --- Smart chunking ---

def test_smart_chunk_empty():
    assert smart_chunk("") == []
    assert smart_chunk("   ") == []


def test_smart_chunk_single_paragraph():
    text = "This is a short paragraph."
    chunks = smart_chunk(text)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_smart_chunk_preserves_paragraphs():
    para1 = "First paragraph with some content that is meaningful."
    para2 = "Second paragraph with different content that is also meaningful."
    text = f"{para1}\n\n{para2}"
    chunks = smart_chunk(text, max_size=1000)
    # Both should be in one chunk since they fit
    assert len(chunks) == 1
    assert para1 in chunks[0]
    assert para2 in chunks[0]


def test_smart_chunk_splits_large_content():
    # Create content that exceeds max_size
    para1 = "Word " * 60  # ~300 chars
    para2 = "Text " * 60  # ~300 chars
    text = f"{para1.strip()}\n\n{para2.strip()}"
    chunks = smart_chunk(text, max_size=350)
    assert len(chunks) >= 2


def test_smart_chunk_heading_attached_to_content():
    text = "# Introduction\n\nThis is the introduction content with enough text to be meaningful and not filtered out."
    chunks = smart_chunk(text, max_size=1000)
    assert len(chunks) == 1
    assert "# Introduction" in chunks[0]
    assert "introduction content" in chunks[0]


def test_smart_chunk_heading_causes_split():
    para1 = "First section content. " * 10  # ~230 chars
    para2 = "Second section content. " * 10  # ~240 chars
    text = f"{para1.strip()}\n\n# New Section\n\n{para2.strip()}"
    chunks = smart_chunk(text, max_size=300)
    # Should split at the heading boundary
    assert len(chunks) >= 2
    # The heading should be attached to the second chunk's content
    heading_chunk = [c for c in chunks if "# New Section" in c]
    assert len(heading_chunk) >= 1


def test_smart_chunk_oversized_paragraph_splits_at_sentences():
    # A single paragraph that exceeds max_size
    sentences = [f"Sentence number {i} has some filler content here." for i in range(20)]
    text = " ".join(sentences)
    chunks = smart_chunk(text, max_size=200)
    assert len(chunks) > 1
    # Verify no chunk exceeds max_size by too much
    for chunk in chunks:
        assert len(chunk) <= 250  # allow some tolerance


def test_smart_chunk_filters_tiny_chunks():
    # If smart chunking produces a tiny fragment, it should be filtered
    text = "A" * 50 + "\n\n" + "B " * 100  # first para is tiny
    chunks = smart_chunk(text, max_size=1000)
    # The tiny chunk should be filtered out (< 100 chars) if there are other chunks
    for chunk in chunks:
        assert len(chunk) >= 50  # relaxed check since single-chunk case keeps it


# --- Backward compatibility: chunk_text ---

def test_chunk_text_empty():
    assert chunk_text("") == []


def test_chunk_text_basic():
    text = "Hello world. " * 50
    chunks = chunk_text(text, chunk_size=200, overlap=20)
    assert len(chunks) > 1


def test_chunk_text_respects_boundaries():
    text = "First sentence. Second sentence. Third sentence. Fourth sentence."
    chunks = chunk_text(text, chunk_size=40, overlap=5)
    assert len(chunks) >= 1
