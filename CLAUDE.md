# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NeuroDocAI — AI Document Intelligence System

RAG-based system that lets users upload documents (PDF, DOCX, CSV, XLSX), extract and embed content, then ask natural language questions with cited answers. Features hybrid search (vector + BM25), LLM reranking, and persistent conversations.

---

## CORE OPERATING RULES (MANDATORY)

### 1. PLAN MODE FIRST
- NEVER start coding immediately
- ALWAYS create a plan first

### 2. ASK USER QUESTIONS
- If unclear → ask
- Do NOT assume

### 3. RPIT LOOP
Every task MUST follow:
1. Research
2. Plan
3. Implement
4. Test

### 4. CONTEXT MANAGEMENT
- Avoid unnecessary context
- Keep responses focused

### 5. VERIFY OUTPUT
- Always test
- Validate integrations

### 6. AUTO DOCUMENTATION
- Update docs after every feature

### 7. AGENT DELEGATION
- Use agents intelligently

---

## DEVELOPMENT STRATEGY

Follow strict phases: **MVP → V1 → V2 → Future**

DO NOT skip phases. Current milestone: **V1** (complete)

---

## KEY COMMANDS

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker compose -f docker/docker-compose.yml up
```

### Tests
```bash
# Backend
cd tests/backend && pytest

# Frontend
cd frontend && npm test
```

---
## CLAUDE WORKFLOWS:

### CORE  

/build-mvp → Build MVP only
/build-feature → RPIT-based feature development
/upgrade-version → Move to next phase
/whats-next → Suggest next steps

---

## ENVIRONMENT SETUP

Required services running locally:
- **PostgreSQL** — structured data (users, documents, queries)
- **ChromaDB** — vector embeddings
- **Ollama** — LLM (`phi3`) and embeddings (`nomic-embed-text`)

Configuration via `.env` file at project root (not committed to git).

---

## ARCHITECTURE REFERENCE

### Backend (`backend/`)
| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI route handlers (auth, upload, query, conversations) |
| `services/` | Business logic (OCR, CSV extraction, embeddings, RAG, BM25 search, reranker, chunking) |
| `pipelines/` | Orchestrated flows (ingestion, query) |
| `agents/` | Custom multi-agent system (V2 scope) |
| `models/` | SQLAlchemy DB models (User, Document, Chunk, Query, Conversation, ConversationMessage) |
| `core/` | Config, database, security, orchestrator |
| `main.py` | FastAPI app entry point |

### Frontend (`frontend/`)
- Next.js 16 App Router with TypeScript
- Tailwind CSS v4 for styling
- shadcn/ui for UI components
- next-themes for dark/light/system theme toggle
- Default theme: dark (semi-dark premium with violet/blue accent)

#### Pages (Route Groups)
- `(auth)/login` — public login page (dark-themed)
- `(auth)/register` — public registration page (live password validation)
- `(app)/dashboard` — main page: hero + drag-drop upload + document list
- `(app)/chat` — split view: document preview (left 30%) + chat window (right 70%)

#### Chat Features
- **Streaming responses** — SSE-based token streaming (`/api/query/stream`), renders tokens in real-time
- **Conversation persistence** — sessions saved per document, resume from sidebar
- Predefined actions: Summarize, Key Points, Change Tone (dropdown: Professional/Casual/Academic/Simple)
- Queries scoped to selected document via doc_id
- Auto-scroll, bouncing dots loading animation

#### Structure
- `src/components/` → UI components (shadcn-based) + auth-guard, nav-bar, theme-provider, theme-toggle, drag-drop-upload
- `src/context/auth-context.tsx` → JWT auth state management
- `src/services/api.ts` → backend API calls (native fetch)
- `src/types/index.ts` → TypeScript interfaces matching backend schemas
- `src/lib/` → shared utilities
- `src/__tests__/` → Jest + React Testing Library tests

### Tests (`tests/`)
- `tests/backend/` → pytest tests (unit + API + RAG)
  - `conftest.py` — shared fixtures, test DB, test client
  - `test_auth_api.py` — auth endpoint tests
  - `test_upload_api.py` — upload endpoint tests
  - `test_query_api.py` — query endpoint tests (mocked RAG)
  - `test_chunking.py` — chunking logic unit tests
  - `test_ocr_service.py` — OCR dispatch unit tests
- `frontend/src/__tests__/` → Jest + React Testing Library tests
  - `api.test.ts` — API service layer tests (fetch mock, auth, errors)
  - `nav-bar.test.tsx` — nav bar rendering, logout, theme toggle
  - `drag-drop-upload.test.tsx` — file validation, upload flow, drag events
  - `login.test.tsx` — login form, submission, error handling
  - `register.test.tsx` — password validation, form submission

---

## TECH DECISIONS

- **Embeddings**: Ollama `nomic-embed-text` only — no cloud fallback
- **Agents**: Custom-built — no LangChain/CrewAI
- **ORM**: SQLAlchemy (no Alembic migrations for now)
- **OCR**: PyMuPDF (primary) + Tesseract fallback for scanned PDFs
- **Keyword Search**: rank_bm25 in-memory (migrate to PostgreSQL tsvector in V2 if needed)
- **Retrieval**: Hybrid (vector + BM25 RRF) → LLM reranking → answer generation
- **Chunking**: Smart (heading/paragraph-aware) for PDF/DOCX, naive for CSV/XLSX
- **UI**: Use shadcn/ui components with Tailwind CSS
- **Theming**: next-themes for dark/light/system toggle (default: dark)
- **Frontend Testing**: Jest + React Testing Library

---

### CONSTRAINTS & POLICIES

-PostgreSQL MUST be used as primary database
-SQLite is NOT allowed
-Use SQLAlchemy ORM
-Maintain strict separation:
api / services / agents / pipelines
- Frontend MUST use shadcn/ui components
- Do NOT create custom UI from scratch unless necessary
-No monolithic files
-Follow modular architecture
-Build incrementally (avoid large code dumps)
-Follow current phase scope strictly

### BUILD RULES

Implement features step-by-step (NOT entire system at once)
Always confirm plan before coding
Validate each step before proceeding
Do NOT implement features from future phases

## AGENTS (V2 SCOPE)

- Ingestion Agent
- Retriever Agent
- QA Agent
- Summarizer Agent
- Insight Agent
- Memory Agent
- Knowledge Agent (DEV ONLY)
- Explore Agent
- Feedback Agent

---

## PIPELINES

### Ingestion
Upload → Extract (PDF/DOCX/CSV/XLSX + OCR fallback) → Smart Chunk (or naive for CSV/XLSX) → Embed → Store

### Query
Query → Hybrid Retrieve (Vector + BM25 RRF) → LLM Rerank → Generate Answer (streaming SSE) → Save to Conversation
- Streaming endpoint: `POST /api/query/stream` returns SSE with `{type: "token", content: "..."}` events
- Non-streaming endpoint: `POST /api/query` still available for backward compatibility
- Conversations: `GET/POST/DELETE /api/conversations` + messages endpoints

---

## GIT RULES

Before writing ANY code,you must:

- Never work on main branch directly
- Always create a feature branch before starting major changes,Branch naming: `feature/<name>`
- Develope and commit on feature branch
- Small, focused commits
- Meaningful commit messages
- Create PR to merge into 'main'
- Never force push to 'main'
- Ensure working state before commit

---

## 🧪 Testing Strategy

We follow a minimal, high-signal testing approach focused on correctness and reliability.

---

### Test Types

- **Unit Tests** → core logic (fast, no external deps)
- **Integration Tests** → API ↔ DB ↔ AI services
- **API Tests** → schema, status codes, errors
- **AI/RAG Tests** → retrieval relevance, grounded answers, citations
- **E2E Tests (minimal)** → critical flows only

---

### Rules

- Tests MUST be written for all features
- All tests MUST pass before completion
- Prefer deterministic and reproducible tests
- Mock external dependencies where possible
- Validate both success and failure cases

---

### Claude Execution

- Generate tests during implementation (RPIT)
- Run tests before completing tasks
- Ask before fixing failures before proceeding

---

## DETAILED DOCUMENTATION

- Product Spec → [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)
- Architecture → [ARCHITECTURE.md](docs/ARCHITECTURE.md) *(pending)*
- API Spec → [API_SPEC.md](docs/API_SPEC.md)
- Status Tracking → [STATUS.md](docs/STATUS.md)
- Changelog → [CHANGELOG.md](docs/CHANGELOG.md)
- Update files in the docs folder after major milestones and major additions to the project.
