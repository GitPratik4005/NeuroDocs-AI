# System Explanations

---

## Project Overview

### Purpose
NeuroDocAI is a RAG-based document intelligence system. Users upload PDF/DOCX files, content gets extracted, chunked, and embedded, then users ask natural language questions and get cited answers with summaries and insights.

### Why It Matters
Core understanding needed before writing any feature code.

---

## Architecture

### Purpose
Defines how backend layers interact and what each directory owns.

### Flow
```
Request → api/ (validate) → services/ (logic) → pipelines/ (orchestrate) → models/ (DB) + ChromaDB
```

### Key Concepts
- **api/** — Thin route handlers. One file per domain: auth.py, upload.py, query.py, insights.py. No business logic here.
- **services/** — Stateless business logic. auth_service (JWT, passwords), ocr_service (Tesseract), embedding_service (Ollama nomic-embed-text), rag_service (retrieve + generate).
- **pipelines/** — Multi-step flows combining services. ingestion_pipeline (upload → extract → chunk → embed → store), query_pipeline (question → retrieve → rerank → answer → cite).
- **models/** — SQLAlchemy ORM. User, Document, Chunk, Query — all mapped to PostgreSQL.
- **core/** — Shared infra. config.py (.env loading), database.py (engine/sessions), security.py (JWT/hashing), orchestrator.py (agent coordination, V2).
- **agents/** — Custom multi-agent system. V2 scope only, not used in MVP.

### Dependencies
PostgreSQL (structured data), ChromaDB (vectors), Ollama (LLM + embeddings)

### Why It Matters
Layer separation prevents coupling. API routes never contain logic, services never import from api/, pipelines orchestrate without duplicating service code.

---

## Data Flows

### Ingestion Pipeline
```
Upload → File type detection → OCR (if needed) → Text extraction → Cleaning → Smart chunking → Embedding generation → Store metadata (PostgreSQL) + vectors (ChromaDB)
```

### Query Pipeline
```
User question → Retrieve relevant chunks (ChromaDB) → Rerank → Build context → LLM generates answer (Ollama) → Add citations → Store query history (PostgreSQL)
```

### Why It Matters
Every MVP feature maps to one or both of these flows. Understanding them is prerequisite to implementation.

---

## Data Storage

### Purpose
Two databases serve different roles.

### Key Concepts
| Store | Contents | Access |
|-------|----------|--------|
| PostgreSQL (port 5433) | Users, documents, chunks (text + metadata), query history | SQLAlchemy models |
| ChromaDB (embedded) | Vector embeddings per chunk | embedding_service / rag_service |

### Why It Matters
Structured data and vector data are separated by design. PostgreSQL handles relations and search history. ChromaDB handles semantic similarity search.

---

## API Design

### Purpose
REST API contract between frontend and backend.

### Key Concepts
- **Auth**: register, login (JWT), get profile. All other endpoints require Bearer token.
- **Upload**: multipart file upload (PDF/DOCX), list/get/delete documents. Status tracking: processing → ready → failed.
- **Query**: POST question with optional document_ids and top_k. Returns answer + sources with relevance scores. History endpoint for past queries.
- **Insights**: Document summaries and key points (V1+ scope).
- **Errors**: `{"detail": "message"}` format. Standard HTTP codes.
- **Pagination**: page/limit params on list endpoints.

### Dependencies
Defined in docs/API_SPEC.md. Implementation in backend/api/.

### Why It Matters
Frontend and backend teams (or sessions) can work independently against this contract.

---

## Service Setup

### Purpose
Local development environment configuration.

### Key Concepts
- **PostgreSQL 18.3** — port 5433, database: neurodocai, user: postgres
- **ChromaDB 1.5.5** — embedded mode via pip (no separate server)
- **Ollama** — port 11434, models: llama3 (LLM), nomic-embed-text (embeddings), phi3 (available)
- **Python 3.13.0** — venv at project root
- **.env** — all connection strings, secrets, and config. Not committed to git.

### Dependencies
All three services must be running before backend starts.

### Why It Matters
Missing or misconfigured services cause silent failures. This documents the exact setup.

---

## Development Phases

### Purpose
Phase-gated roadmap preventing scope creep.

### Key Concepts
- **MVP** (current): Auth (JWT), upload PDF/DOCX, basic text extraction, basic chunking + embedding, basic RAG (semantic search + Q&A), simple chat UI
- **V1**: OCR, smart chunking, hybrid search, reranking, citations, auto summaries
- **V2**: Multi-agent architecture (6 agents), insight generation, memory system, enhanced dashboard
- **Future**: Multi-doc comparison, RBAC, cloud deploy, real-time monitoring, dynamic model routing

### Why It Matters
V1/V2 features must NOT be implemented during MVP. Each phase builds on the previous one.
