"""
Text extraction service for PDF, DOCX, CSV, and XLSX files.
Extracts selectable text and OCRs embedded images, merging both
in document order (by vertical position for PDFs, by element order for DOCX).
"""

import logging
import io
import os
import shutil

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from docx.opc.constants import RELATIONSHIP_TYPE as RT

from services.csv_extractor import extract_text_from_csv, extract_text_from_xlsx

logger = logging.getLogger(__name__)

# Skip images smaller than this (filters logos, icons, decorative elements)
MIN_IMAGE_WIDTH = 150
MIN_IMAGE_HEIGHT = 150


def _setup_tesseract():
    """Import pytesseract and configure the binary path. Returns pytesseract module or None."""
    try:
        import pytesseract
        from PIL import Image

        if not shutil.which("tesseract"):
            tesseract_path = r"C:\Users\PratikKolhe\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
            if os.path.exists(tesseract_path):
                pytesseract.pytesseract.tesseract_cmd = tesseract_path

        return pytesseract, Image
    except ImportError:
        logger.warning("pytesseract or Pillow not installed — image OCR disabled")
        return None, None


def _ocr_image_bytes(image_bytes: bytes, pytesseract, Image) -> str:
    """OCR a single image from its raw bytes. Returns extracted text or empty string."""
    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Skip small images
        w, h = img.size
        if w < MIN_IMAGE_WIDTH or h < MIN_IMAGE_HEIGHT:
            return ""

        text = pytesseract.image_to_string(img).strip()
        return text
    except Exception as e:
        logger.warning(f"OCR failed for image: {e}")
        return ""


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.
    - Extracts selectable text blocks with positions
    - Finds embedded images, OCRs them if large enough
    - Merges both sorted by vertical position (top to bottom)
    """
    pytesseract, Image = _setup_tesseract()
    doc = fitz.open(file_path)
    all_page_texts = []

    for page in doc:
        # Collect content blocks: (y_position, text)
        blocks = []

        # 1. Extract text blocks with positions
        text_dict = page.get_text("dict")
        for block in text_dict.get("blocks", []):
            if block["type"] == 0:  # text block
                block_text = ""
                for line in block.get("lines", []):
                    line_text = "".join(span["text"] for span in line.get("spans", []))
                    if line_text.strip():
                        block_text += line_text + "\n"
                if block_text.strip():
                    y_pos = block["bbox"][1]  # top-y coordinate
                    blocks.append((y_pos, block_text.strip()))

        # 2. Find and OCR embedded images
        if pytesseract and Image:
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue

                    img_bytes = base_image["image"]
                    width = base_image.get("width", 0)
                    height = base_image.get("height", 0)

                    # Skip small images
                    if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
                        continue

                    # Get image position on page
                    img_rects = page.get_image_rects(xref)
                    y_pos = img_rects[0].y0 if img_rects else 9999

                    ocr_text = _ocr_image_bytes(img_bytes, pytesseract, Image)
                    if ocr_text:
                        blocks.append((y_pos, f"[Image content: {ocr_text}]"))

                except Exception as e:
                    logger.warning(f"Failed to process image xref {xref}: {e}")

        # Sort blocks by vertical position and join
        blocks.sort(key=lambda b: b[0])
        page_text = "\n\n".join(text for _, text in blocks)
        if page_text.strip():
            all_page_texts.append(page_text)

    doc.close()
    return "\n\n".join(all_page_texts)


def extract_text_from_docx(file_path: str) -> str:
    """
    Extract text from a DOCX file.
    - Walks document elements in order (paragraphs + images)
    - OCRs embedded images if large enough
    - Output preserves document element order
    """
    pytesseract, Image = _setup_tesseract()
    doc = DocxDocument(file_path)
    parts = []

    # Build a map of relationship ID -> image blob
    image_map = {}
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                image_map[rel.rId] = rel.target_part.blob
            except Exception:
                pass

    # Walk through document body elements in order
    for element in doc.element.body:
        tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

        if tag == "p":
            # Paragraph — extract text
            from docx.text.paragraph import Paragraph
            para = Paragraph(element, doc)
            text = para.text.strip()

            # Check for inline images in this paragraph
            for run in para.runs:
                drawing_elements = run._element.findall(
                    ".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing"
                ) or run._element.findall(
                    ".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"
                )

                # Look for blip elements (image references) in drawings
                for drawing in run._element.iter():
                    if drawing.tag.endswith("}blip"):
                        embed_id = drawing.get(
                            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
                        )
                        if embed_id and embed_id in image_map and pytesseract and Image:
                            ocr_text = _ocr_image_bytes(image_map[embed_id], pytesseract, Image)
                            if ocr_text:
                                text += f"\n[Image content: {ocr_text}]"

            if text:
                parts.append(text)

        elif tag == "tbl":
            # Table — extract cell text
            from docx.table import Table
            table = Table(element, doc)
            rows = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    rows.append(" | ".join(cells))
            if rows:
                parts.append("\n".join(rows))

    return "\n\n".join(parts)


def extract_text(file_path: str, file_type: str) -> str:
    """Dispatch to the correct extractor based on file type."""
    extractors = {
        "pdf": extract_text_from_pdf,
        "docx": extract_text_from_docx,
        "csv": extract_text_from_csv,
        "xlsx": extract_text_from_xlsx,
    }
    extractor = extractors.get(file_type)
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")
    return extractor(file_path)
