"""Tests for conversations API endpoints."""

import os
import pytest
from unittest.mock import patch, MagicMock

# These tests require conftest.py (full app + DB)
# They will only pass when PostgreSQL is available


def test_create_conversation(client, auth_headers, db_session):
    """Create a conversation for a document."""
    # First upload a document
    from models.document import Document
    doc = Document(
        id="test-doc-1",
        user_id=_get_user_id(client, auth_headers),
        title="test.pdf",
        file_type="pdf",
        file_path="/tmp/test.pdf",
        status="ready",
        chunk_count=5,
    )
    db_session.add(doc)
    db_session.commit()

    resp = client.post(
        "/api/conversations",
        json={"document_id": "test-doc-1"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["document_id"] == "test-doc-1"
    assert "id" in data
    assert data["message_count"] == 0


def test_create_conversation_missing_doc(client, auth_headers):
    """Creating conversation for non-existent doc returns 404."""
    resp = client.post(
        "/api/conversations",
        json={"document_id": "nonexistent"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


def test_list_conversations(client, auth_headers, db_session):
    """List conversations filtered by document."""
    user_id = _get_user_id(client, auth_headers)
    from models.document import Document
    from models.conversation import Conversation

    doc = Document(id="doc-list", user_id=user_id, title="test.pdf",
                   file_type="pdf", file_path="/tmp/test.pdf", status="ready")
    db_session.add(doc)
    db_session.commit()

    # Create two conversations
    client.post("/api/conversations", json={"document_id": "doc-list"}, headers=auth_headers)
    client.post("/api/conversations", json={"document_id": "doc-list"}, headers=auth_headers)

    resp = client.get("/api/conversations?doc_id=doc-list", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["conversations"]) == 2


def test_add_and_get_messages(client, auth_headers, db_session):
    """Add messages to a conversation and retrieve them."""
    user_id = _get_user_id(client, auth_headers)
    from models.document import Document

    doc = Document(id="doc-msg", user_id=user_id, title="test.pdf",
                   file_type="pdf", file_path="/tmp/test.pdf", status="ready")
    db_session.add(doc)
    db_session.commit()

    # Create conversation
    conv_resp = client.post("/api/conversations", json={"document_id": "doc-msg"}, headers=auth_headers)
    conv_id = conv_resp.json()["id"]

    # Add messages
    client.post(f"/api/conversations/{conv_id}/messages",
                json={"role": "user", "content": "What is this about?"},
                headers=auth_headers)
    client.post(f"/api/conversations/{conv_id}/messages",
                json={"role": "assistant", "content": "This document is about..."},
                headers=auth_headers)

    # Get messages
    resp = client.get(f"/api/conversations/{conv_id}/messages", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][1]["role"] == "assistant"


def test_invalid_role(client, auth_headers, db_session):
    """Adding a message with invalid role returns 400."""
    user_id = _get_user_id(client, auth_headers)
    from models.document import Document

    doc = Document(id="doc-role", user_id=user_id, title="test.pdf",
                   file_type="pdf", file_path="/tmp/test.pdf", status="ready")
    db_session.add(doc)
    db_session.commit()

    conv_resp = client.post("/api/conversations", json={"document_id": "doc-role"}, headers=auth_headers)
    conv_id = conv_resp.json()["id"]

    resp = client.post(f"/api/conversations/{conv_id}/messages",
                       json={"role": "system", "content": "invalid"},
                       headers=auth_headers)
    assert resp.status_code == 400


def test_delete_conversation(client, auth_headers, db_session):
    """Deleting a conversation removes it and its messages."""
    user_id = _get_user_id(client, auth_headers)
    from models.document import Document

    doc = Document(id="doc-del", user_id=user_id, title="test.pdf",
                   file_type="pdf", file_path="/tmp/test.pdf", status="ready")
    db_session.add(doc)
    db_session.commit()

    conv_resp = client.post("/api/conversations", json={"document_id": "doc-del"}, headers=auth_headers)
    conv_id = conv_resp.json()["id"]

    # Add a message
    client.post(f"/api/conversations/{conv_id}/messages",
                json={"role": "user", "content": "test"},
                headers=auth_headers)

    # Delete
    resp = client.delete(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify gone
    resp = client.get(f"/api/conversations/{conv_id}/messages", headers=auth_headers)
    assert resp.status_code == 404


def test_conversation_not_found(client, auth_headers):
    """Accessing non-existent conversation returns 404."""
    resp = client.get("/api/conversations/nonexistent/messages", headers=auth_headers)
    assert resp.status_code == 404


def _get_user_id(client, auth_headers) -> str:
    """Helper to get the current user's ID."""
    resp = client.get("/api/auth/me", headers=auth_headers)
    return resp.json()["id"]
