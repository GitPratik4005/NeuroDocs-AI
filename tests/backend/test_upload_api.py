"""API tests for document upload endpoints."""

import io
from unittest.mock import patch


def _make_pdf_file():
    """Create a minimal valid PDF in memory."""
    content = b"""%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
206
%%EOF"""
    return ("test.pdf", io.BytesIO(content), "application/pdf")


@patch("api.upload._run_ingestion_background")
def test_upload_pdf_success(mock_ingest, client, auth_headers):
    name, file, ctype = _make_pdf_file()
    resp = client.post(
        "/api/upload",
        files={"file": (name, file, ctype)},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "test.pdf"
    assert data["file_type"] == "pdf"
    assert data["status"] == "processing"


@patch("api.upload._run_ingestion_background")
def test_upload_with_custom_title(mock_ingest, client, auth_headers):
    name, file, ctype = _make_pdf_file()
    resp = client.post(
        "/api/upload",
        files={"file": (name, file, ctype)},
        data={"title": "My Resume"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["title"] == "My Resume"


def test_upload_unsupported_type(client, auth_headers):
    resp = client.post(
        "/api/upload",
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "unsupported" in resp.json()["detail"].lower()


def test_upload_no_auth(client):
    name, file, ctype = _make_pdf_file()
    resp = client.post("/api/upload", files={"file": (name, file, ctype)})
    assert resp.status_code == 401


@patch("api.upload._run_ingestion_background")
def test_list_documents(mock_ingest, client, auth_headers):
    # Upload two docs
    for i in range(2):
        name, file, ctype = _make_pdf_file()
        client.post("/api/upload", files={"file": (name, file, ctype)}, headers=auth_headers)

    resp = client.get("/api/upload/documents", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["documents"]) == 2


@patch("api.upload._run_ingestion_background")
def test_get_single_document(mock_ingest, client, auth_headers):
    name, file, ctype = _make_pdf_file()
    upload_resp = client.post("/api/upload", files={"file": (name, file, ctype)}, headers=auth_headers)
    doc_id = upload_resp.json()["id"]

    resp = client.get(f"/api/upload/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == doc_id


def test_get_nonexistent_document(client, auth_headers):
    resp = client.get("/api/upload/documents/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404


@patch("api.upload._run_ingestion_background")
def test_delete_document(mock_ingest, client, auth_headers):
    name, file, ctype = _make_pdf_file()
    upload_resp = client.post("/api/upload", files={"file": (name, file, ctype)}, headers=auth_headers)
    doc_id = upload_resp.json()["id"]

    resp = client.delete(f"/api/upload/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify it's gone
    resp = client.get(f"/api/upload/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 404
