"""Unit tests for text extraction service (dispatcher + image-aware OCR)."""

import pytest
from unittest.mock import patch, MagicMock
from services.ocr_service import (
    extract_text,
    _setup_tesseract,
    _ocr_image_bytes,
    extract_text_from_pdf,
    extract_text_from_docx,
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
)


# --- Dispatcher tests ---

def test_unsupported_file_type():
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_text("somefile.txt", "txt")


def test_dispatcher_routes_pdf():
    with pytest.raises(Exception):
        extract_text("nonexistent.pdf", "pdf")


def test_dispatcher_routes_docx():
    with pytest.raises(Exception):
        extract_text("nonexistent.docx", "docx")


def test_dispatcher_routes_csv():
    with pytest.raises(Exception):
        extract_text("nonexistent.csv", "csv")


def test_dispatcher_routes_xlsx():
    with pytest.raises(Exception):
        extract_text("nonexistent.xlsx", "xlsx")


# --- _setup_tesseract tests ---

def test_setup_tesseract_import_error():
    """Returns (None, None) when pytesseract not installed."""
    with patch.dict("sys.modules", {"pytesseract": None, "PIL": None, "PIL.Image": None}):
        result = _setup_tesseract()
    assert result == (None, None)


# --- _ocr_image_bytes tests ---

def test_ocr_image_bytes_small_image():
    """Skips images smaller than minimum size."""
    mock_pytesseract = MagicMock()
    mock_Image = MagicMock()

    # Create a small mock image
    mock_img = MagicMock()
    mock_img.size = (100, 100)  # Below MIN_IMAGE_WIDTH/HEIGHT
    mock_Image.open.return_value = mock_img

    result = _ocr_image_bytes(b"fake_image_data", mock_pytesseract, mock_Image)
    assert result == ""
    mock_pytesseract.image_to_string.assert_not_called()


def test_ocr_image_bytes_valid_image():
    """OCRs a valid-sized image and returns text."""
    mock_pytesseract = MagicMock()
    mock_pytesseract.image_to_string.return_value = "  Hello World  "
    mock_Image = MagicMock()

    mock_img = MagicMock()
    mock_img.size = (200, 200)  # Above minimum
    mock_Image.open.return_value = mock_img

    result = _ocr_image_bytes(b"fake_image_data", mock_pytesseract, mock_Image)
    assert result == "Hello World"


def test_ocr_image_bytes_exception():
    """Returns empty string on OCR failure."""
    mock_pytesseract = MagicMock()
    mock_Image = MagicMock()
    mock_Image.open.side_effect = Exception("Corrupt image")

    result = _ocr_image_bytes(b"bad_data", mock_pytesseract, mock_Image)
    assert result == ""


def test_ocr_image_bytes_empty_result():
    """Returns empty string when OCR finds no text."""
    mock_pytesseract = MagicMock()
    mock_pytesseract.image_to_string.return_value = "   "
    mock_Image = MagicMock()

    mock_img = MagicMock()
    mock_img.size = (300, 300)
    mock_Image.open.return_value = mock_img

    result = _ocr_image_bytes(b"fake_image_data", mock_pytesseract, mock_Image)
    assert result == ""


# --- PDF extraction tests ---

def test_pdf_extraction_text_blocks():
    """Extracts text blocks from PDF sorted by position."""
    mock_page = MagicMock()
    mock_page.get_text.return_value = {
        "blocks": [
            {
                "type": 0,
                "bbox": [0, 100, 500, 120],
                "lines": [{"spans": [{"text": "Second paragraph"}]}],
            },
            {
                "type": 0,
                "bbox": [0, 10, 500, 30],
                "lines": [{"spans": [{"text": "First paragraph"}]}],
            },
        ]
    }
    mock_page.get_images.return_value = []

    mock_doc = MagicMock()
    mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))

    with patch("fitz.open", return_value=mock_doc), \
         patch("services.ocr_service._setup_tesseract", return_value=(None, None)):
        result = extract_text_from_pdf("test.pdf")

    assert "First paragraph" in result
    assert "Second paragraph" in result
    # First should come before second (sorted by y position: 10 < 100)
    assert result.index("First paragraph") < result.index("Second paragraph")


def test_pdf_extraction_with_images():
    """Extracts text and OCRs embedded images, merged by position."""
    mock_page = MagicMock()
    mock_page.get_text.return_value = {
        "blocks": [
            {
                "type": 0,
                "bbox": [0, 10, 500, 30],
                "lines": [{"spans": [{"text": "Text above image"}]}],
            },
            {
                "type": 0,
                "bbox": [0, 200, 500, 220],
                "lines": [{"spans": [{"text": "Text below image"}]}],
            },
        ]
    }
    # One image at y=100
    mock_page.get_images.return_value = [(1, 0, 0, 0, 0, 0, 0, 0, 0, 0)]

    mock_rect = MagicMock()
    mock_rect.y0 = 100
    mock_page.get_image_rects.return_value = [mock_rect]

    mock_doc = MagicMock()
    mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
    mock_doc.extract_image.return_value = {
        "image": b"fake_png",
        "width": 300,
        "height": 300,
    }

    mock_pytesseract = MagicMock()
    mock_Image = MagicMock()

    with patch("fitz.open", return_value=mock_doc), \
         patch("services.ocr_service._setup_tesseract", return_value=(mock_pytesseract, mock_Image)), \
         patch("services.ocr_service._ocr_image_bytes", return_value="Chart data"):
        result = extract_text_from_pdf("test.pdf")

    assert "Text above image" in result
    assert "[Image content: Chart data]" in result
    assert "Text below image" in result
    # Verify order: text (y=10) < image (y=100) < text (y=200)
    assert result.index("Text above image") < result.index("Chart data") < result.index("Text below image")


def test_pdf_extraction_skips_small_images():
    """Skips images smaller than minimum dimensions."""
    mock_page = MagicMock()
    mock_page.get_text.return_value = {
        "blocks": [
            {
                "type": 0,
                "bbox": [0, 10, 500, 30],
                "lines": [{"spans": [{"text": "Some text"}]}],
            },
        ]
    }
    mock_page.get_images.return_value = [(1, 0, 0, 0, 0, 0, 0, 0, 0, 0)]

    mock_doc = MagicMock()
    mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
    mock_doc.extract_image.return_value = {
        "image": b"tiny_img",
        "width": 50,  # Below MIN_IMAGE_WIDTH
        "height": 50,
    }

    mock_pytesseract = MagicMock()
    mock_Image = MagicMock()

    with patch("fitz.open", return_value=mock_doc), \
         patch("services.ocr_service._setup_tesseract", return_value=(mock_pytesseract, mock_Image)):
        result = extract_text_from_pdf("test.pdf")

    assert "Some text" in result
    assert "[Image content:" not in result


# --- Constants ---

def test_min_image_dimensions():
    """Verify minimum image dimension constants."""
    assert MIN_IMAGE_WIDTH == 150
    assert MIN_IMAGE_HEIGHT == 150
