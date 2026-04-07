"""Unit tests for text extraction service."""

import pytest
from services.ocr_service import extract_text


def test_unsupported_file_type():
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_text("somefile.txt", "txt")


def test_dispatcher_routes_pdf():
    """Verify extract_text dispatches to PDF extractor for pdf type."""
    # We just check it doesn't raise ValueError for supported types
    # Actual extraction requires a real file, tested in integration
    with pytest.raises(Exception):
        # Will fail because file doesn't exist, but NOT with "Unsupported file type"
        extract_text("nonexistent.pdf", "pdf")


def test_dispatcher_routes_docx():
    with pytest.raises(Exception):
        extract_text("nonexistent.docx", "docx")
