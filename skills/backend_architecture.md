---
name: backend-architecture
description: Backend structure, layer responsibilities, and data flow for NeuroDocAI
---

# Backend Architecture

## Layer Overview

```
Request → api/ → services/ → pipelines/ → models/ + ChromaDB
                                  ↑
                              agents/ (V2)
```

## Layers

**api/** — Route handlers. Thin layer: validate input, call services, return response. One file per domain: `auth.py`, `upload.py`, `query.py`, `insights.py`.

**services/** — Business logic. Stateless functions called by API routes.
- `auth_service.py` — JWT token creation, password hashing, user validation
- `ocr_service.py` — Tesseract text extraction from images/scanned PDFs
- `embedding_service.py` — Generate embeddings via Ollama (`nomic-embed-text`)
- `rag_service.py` — Retrieve chunks from ChromaDB, build context, call LLM

**pipelines/** — Multi-step orchestrated flows that combine multiple services.
- `ingestion_pipeline.py` — Upload → extract text → clean → chunk → embed → store
- `query_pipeline.py` — Question → retrieve → rerank → generate answer → cite sources

**models/** — SQLAlchemy ORM models mapped to PostgreSQL.
- `user.py` — User account (email, hashed password, name)
- `document.py` — Uploaded document metadata (title, type, status)
- `chunk.py` — Text chunks with page numbers, linked to document
- `query.py` — Query history (question, answer, sources, user)

**core/** — Shared infrastructure.
- `config.py` — Load `.env`, app settings
- `database.py` — SQLAlchemy engine, session factory
- `security.py` — JWT encode/decode, password hashing
- `orchestrator.py` — Agent coordination (V2)

**agents/** — Custom multi-agent system (V2 scope). Not used in MVP.

## Data Storage

| Store | What | Access Layer |
|-------|------|-------------|
| PostgreSQL | Users, documents, chunks, queries | SQLAlchemy via `models/` |
| ChromaDB | Vector embeddings per chunk | `embedding_service.py` / `rag_service.py` |

## Key Rules

- API routes must NOT contain business logic — delegate to services
- Services must NOT import from api/ — keep layers independent
- Pipelines orchestrate services — they don't duplicate service logic
- All DB access goes through SQLAlchemy models — no raw SQL
