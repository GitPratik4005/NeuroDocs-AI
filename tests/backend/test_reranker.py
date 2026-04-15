"""Tests for LLM-based reranker."""

import pytest
from unittest.mock import patch, MagicMock
from services.reranker import rerank, _parse_ranking


# --- Parse ranking tests ---

def test_parse_ranking_basic():
    result = _parse_ranking("2, 1, 3", 3)
    assert result == [1, 0, 2]  # 0-based


def test_parse_ranking_with_text():
    result = _parse_ranking("The most relevant passages are: 3, 1, 2", 3)
    assert result == [2, 0, 1]


def test_parse_ranking_deduplicates():
    result = _parse_ranking("1, 1, 2, 3", 3)
    assert result == [0, 1, 2]


def test_parse_ranking_ignores_out_of_range():
    result = _parse_ranking("1, 5, 2", 3)
    assert result == [0, 1]  # 5 is out of range (only 3 chunks)


def test_parse_ranking_empty():
    result = _parse_ranking("", 3)
    assert result == []


def test_parse_ranking_no_numbers():
    result = _parse_ranking("I cannot determine relevance", 3)
    assert result == []


# --- Rerank function tests ---

def test_rerank_empty_chunks():
    result = rerank("question", [])
    assert result == []


def test_rerank_single_chunk():
    result = rerank("question", ["only chunk"])
    assert result == ["only chunk"]


def test_rerank_with_mock_llm():
    chunks = ["chunk A about dogs", "chunk B about cats", "chunk C about birds"]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "message": {"content": "2, 3, 1"}
    }
    mock_response.raise_for_status = MagicMock()

    with patch("services.reranker.httpx.post", return_value=mock_response):
        result = rerank("tell me about cats", chunks, top_k=3)

    # LLM said 2,3,1 → 0-based [1,2,0] → chunks[1], chunks[2], chunks[0]
    assert result[0] == "chunk B about cats"
    assert result[1] == "chunk C about birds"
    assert result[2] == "chunk A about dogs"


def test_rerank_fallback_on_error():
    chunks = ["chunk A", "chunk B", "chunk C"]

    with patch("services.reranker.httpx.post", side_effect=Exception("LLM down")):
        result = rerank("question", chunks, top_k=2)

    # Should fall back to original order, limited to top_k
    assert result == ["chunk A", "chunk B"]
