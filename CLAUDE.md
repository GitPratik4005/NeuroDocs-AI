# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NeuroDocAI — AI Document Intelligence System

RAG-based system that lets users upload documents (PDF, DOCX), extract and embed content, then ask natural language questions with cited answers. Generates summaries, key insights, and action suggestions.

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

DO NOT skip phases. Current milestone: **MVP**

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
- **Ollama** — LLM and embeddings (`nomic-embed-text`)

Configuration via `.env` file at project root (not committed to git).

---

## ARCHITECTURE REFERENCE

### Backend (`backend/`)
| Directory | Purpose |
|-----------|---------|
| `api/` | FastAPI route handlers (auth, upload, query, insights) |
| `services/` | Business logic (auth, OCR, embeddings, RAG) |
| `pipelines/` | Orchestrated flows (ingestion, query) |
| `agents/` | Custom multi-agent system (V2 scope) |
| `models/` | SQLAlchemy DB models (User, Document, Chunk, Query) |
| `core/` | Config, database, security, orchestrator |
| `main.py` | FastAPI app entry point |

### Frontend (`frontend/`)
- Next.js App Router with TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components

#### Pages
- login
- dashboard
- upload
- chat

#### Structure
- `components/` → reusable UI components (shadcn-based)
- `services/api.ts` → backend API calls
- `lib/` → shared utilities

---

## TECH DECISIONS

- **Embeddings**: Ollama `nomic-embed-text` only — no cloud fallback
- **Agents**: Custom-built — no LangChain/CrewAI
- **ORM**: SQLAlchemy (no Alembic migrations for now)
- **OCR**: Tesseract (primary)
- **UI**: Use shadcn/ui components with Tailwind CSS

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
-Follow MVP scope strictly

### BUILD RULES

Implement features step-by-step (NOT entire system at once)
Always confirm plan before coding
Validate each step before proceeding
Do NOT implement V1/V2 features during MVP phase

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
Upload → OCR → Clean → Chunk → Embed → Store

### Query
Query → Retrieve → Rerank → Answer → Cite → Memory

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
