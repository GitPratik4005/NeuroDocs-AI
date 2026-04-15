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

Project status: **Concluded at V1** (merged to `main` 2026-04-15, PR #2).
V2 items are archived as **possible future improvements** in `docs/STATUS.md`
and `docs/PROJECT_SPEC.md` — no active development planned.

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
- Tailwind CSS v4 for styling (custom `@utility` blocks for glass + aurora)
- shadcn/ui + Base UI primitives (note: `@base-ui/react/button` does NOT support `asChild` — use `buttonVariants()` + `<Link>`)
- next-themes for dark/light/system theme toggle (default: dark)
- **Framer Motion** for orchestrated animations (page transitions, scroll reveals, stagger, 3D tilt)
- **Typography**: DM Sans (body/headings) + Geist Mono (code)
- **Design system**: "Aurora Glass" — animated mesh-gradient backgrounds + glassmorphic cards + Gold + Purple Tech OKLch palette

#### Pages (Route Groups)
- `/` — public landing page (hero, features grid, how-it-works timeline, tech stack, CTA)
- `/about` — public About page (functionalities, build info, milestones)
- `(auth)/login` — glass card with aurora background + 3D tilt on hover
- `(auth)/register` — same treatment + animated password rules via AnimatePresence
- `(app)/dashboard` — aurora bg + glass hero + glass-wrapped table (desktop) / stagger card grid (mobile)
- `(app)/chat` — glass split view: document preview (left) + chat window (right) with conversation sidebar

#### Chat Features
- **Streaming responses** — SSE-based token streaming (`/api/query/stream`), renders tokens in real-time
- **Conversation persistence** — sessions saved per document, resume from sidebar
- Predefined actions: Summarize, Key Points, Change Tone (dropdown: Professional/Casual/Academic/Simple)
- Queries scoped to selected document via doc_id
- Auto-scroll, pulsing gold orb loading indicator

#### Structure
- `src/components/` → UI components (shadcn + Base UI) + auth-guard, nav-bar (floating glass pill), theme-provider, theme-toggle, drag-drop-upload, **aurora-background**, **ui/glass-card**
- `src/components/motion/` → `fade-in.tsx`, `stagger-list.tsx` (scroll-reveal wrappers)
- `src/context/auth-context.tsx` → JWT auth state management
- `src/services/api.ts` → backend API calls (native fetch)
- `src/types/index.ts` → TypeScript interfaces matching backend schemas
- `src/lib/` → `utils.ts` (cn helper), `motion.ts` (shared Framer Motion variants)
- `src/app/globals.css` → Tailwind v4 theme tokens + `@utility glass-card`, `glass-panel`, `aurora-bg`, `aurora-veil`, `gold-text` + keyframes (`aurora-drift`, `gold-shimmer`, `pulse-orb`) + `prefers-reduced-motion` overrides
- `src/__tests__/` → Jest + React Testing Library tests

#### Design Notes
- Lenis smooth scroll was removed: caused scroll stalls on Windows precision touchpads. Use native scroll + Framer Motion `whileInView` for reveals.
- All animations respect `prefers-reduced-motion` via CSS media query in `globals.css`
- Button variants: `gold`, `purple`, `glass` (in addition to shadcn defaults)

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
- **UI**: shadcn/ui + Base UI primitives with Tailwind CSS v4
- **Design system**: "Aurora Glass" — glassmorphism + animated aurora backgrounds + Gold/Purple OKLch palette
- **Animations**: Framer Motion (orchestrated reveals, 3D tilt, page transitions). Native scroll — Lenis was removed due to touchpad stalls.
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
