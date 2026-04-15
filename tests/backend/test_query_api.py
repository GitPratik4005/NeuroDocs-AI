"""API tests for query endpoints with mocked RAG services."""

from unittest.mock import patch, MagicMock


@patch("pipelines.query_pipeline.generate_answer", return_value="Mocked answer about the document.")
@patch("pipelines.query_pipeline.hybrid_retrieve")
def test_query_success(mock_retrieve, mock_answer, client, auth_headers):
    mock_retrieve.return_value = {
        "documents": [["chunk 1 content", "chunk 2 content"]],
        "metadatas": [[{"document_id": "doc1", "user_id": "u1", "chunk_index": 0},
                       {"document_id": "doc1", "user_id": "u1", "chunk_index": 1}]],
        "ids": [["chunk-id-1", "chunk-id-2"]],
        "distances": [[0.1, 0.2]],
    }

    resp = client.post("/api/query", json={"question": "What is this about?"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["question"] == "What is this about?"
    assert data["answer"] == "Mocked answer about the document."
    assert len(data["source_chunks"]) == 2
    assert "doc1" in data["document_ids"]


@patch("pipelines.query_pipeline.hybrid_retrieve")
def test_query_no_results(mock_retrieve, client, auth_headers):
    mock_retrieve.return_value = {
        "documents": [[]],
        "metadatas": [[]],
        "ids": [[]],
        "distances": [[]],
    }

    resp = client.post("/api/query", json={"question": "Unknown topic"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "couldn't find" in data["answer"].lower()
    assert data["source_chunks"] == []


def test_query_no_auth(client):
    resp = client.post("/api/query", json={"question": "test"})
    assert resp.status_code == 401


@patch("pipelines.query_pipeline.generate_answer", return_value="Answer 1")
@patch("pipelines.query_pipeline.hybrid_retrieve")
def test_query_history(mock_retrieve, mock_answer, client, auth_headers):
    mock_retrieve.return_value = {
        "documents": [["some content"]],
        "metadatas": [[{"document_id": "doc1", "user_id": "u1", "chunk_index": 0}]],
        "ids": [["c1"]],
        "distances": [[0.1]],
    }

    # Create a query first
    client.post("/api/query", json={"question": "First question"}, headers=auth_headers)

    # Check history
    resp = client.get("/api/query/history", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert data["queries"][0]["question"] == "First question"


def test_query_history_no_auth(client):
    resp = client.get("/api/query/history")
    assert resp.status_code == 401
