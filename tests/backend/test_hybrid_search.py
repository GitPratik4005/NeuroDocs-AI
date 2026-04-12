"""Tests for BM25 keyword search and hybrid retrieval."""

import pytest
from services.keyword_search import bm25_search, _tokenize


def test_tokenize_basic():
    tokens = _tokenize("Hello, World! Test 123.")
    assert tokens == ["hello", "world", "test", "123"]


def test_tokenize_empty():
    assert _tokenize("") == []


def test_bm25_search_basic():
    chunks = [
        "The quick brown fox jumps over the lazy dog",
        "Python is a great programming language",
        "Machine learning models need training data",
        "The fox is quick and brown",
    ]
    ids = ["c1", "c2", "c3", "c4"]

    results = bm25_search("quick brown fox", chunks, ids, top_k=4)
    assert len(results) == 4
    # The fox-related chunk should score highest
    assert results[0][0] == "c1"
    # Scores should be descending
    assert results[0][1] >= results[1][1]


def test_bm25_search_empty_query():
    results = bm25_search("", ["chunk1"], ["c1"])
    assert results == []


def test_bm25_search_empty_chunks():
    results = bm25_search("query", [], [])
    assert results == []


def test_bm25_search_returns_scores():
    chunks = ["apple banana cherry", "dog cat bird"]
    ids = ["c1", "c2"]
    results = bm25_search("apple", chunks, ids, top_k=2)
    assert len(results) == 2
    # First result should have higher score
    assert results[0][1] >= results[1][1]


def test_bm25_search_top_k_limit():
    chunks = [f"document number {i}" for i in range(10)]
    ids = [f"c{i}" for i in range(10)]
    results = bm25_search("document number", chunks, ids, top_k=3)
    assert len(results) == 3
