# Project Status

---

## Current Phase
V1

---

## Completed
- Claude Code setup (CLAUDE.md, commands, agents, skills, hooks)
- Project documentation (PROJECT_SPEC, API_SPEC, STATUS, CHANGELOG)
- GitHub repo (GitPratik4005/NeuroDocs-AI)
- Environment setup (.env, .env.example, .gitignore, README)
- Python venv (3.13.0)
- PostgreSQL 18.3 installed (port 5433, `neurodocai` DB created)
- ChromaDB 1.5.5 installed (embedded via pip)
- Ollama configured (llama3, nomic-embed-text, phi3)
- Knowledge documentation (code_explanations.md, system_explanations.md)
- **Backend skeleton** — FastAPI app, config, database, health check
- **Auth system** — JWT register/login/me with bcrypt hashing
- **Document upload** — POST/GET/DELETE with file validation, paginated listing
- **Text extraction** — PDF (PyMuPDF) and DOCX (python-docx) extractors
- **Ingestion pipeline** — improved chunking (500 chars, 50 overlap, min 100 char, smart boundary detection) → Ollama embedding → ChromaDB storage
- **RAG query pipeline** — semantic retrieval → Ollama LLM answer generation → query history
- **Frontend MVP** — Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
  - Login & Register pages with JWT auth
  - Dashboard with document list, status badges, pagination, delete
  - Upload page with file validation and toast feedback
  - Chat page with Q&A interface and source references
  - Auth context/guard with protected routes
  - API service layer (native fetch, JWT management)
  - Navbar with navigation and logout
- **Backend tests** — 30 tests passing (unit + API + RAG tests)
  - Auth API tests (register, login, me, error cases)
  - Upload API tests (upload, list, get, delete, validation)
  - Query API tests (query, history, mocked RAG)
  - Chunking unit tests
  - OCR service unit tests
- **Frontend redesign** — premium single-page experience
  - Dark/light/system theme toggle (next-themes)
  - Dashboard with hero section + drag-and-drop upload + document list
  - Chat split view: document preview (left) + chat window (right)
  - Predefined actions: Summarize, Key Points, Change Tone (4 options)
  - RAG scoped to selected document via doc_id
  - Simplified nav bar (logo + theme toggle + logout)
  - Restyled auth pages (dark theme compatible)
  - Micro-interactions: hover glow, animations, bouncing dots loader
  - Responsive: mobile-friendly table, stacked chat layout
- **Frontend tests** — 31 tests passing (Jest + React Testing Library)
  - API service tests (fetch mock, auth headers, error handling)
  - Nav bar tests (rendering, logout, theme toggle)
  - Drag-drop upload tests (validation, upload flow, error handling)
  - Login page tests (form submission, error display, loading state)
  - Register page tests (password validation, form submission)
- **Streaming responses** — SSE-based token streaming for chat (like ChatGPT/Claude)
  - Backend: `/api/query/stream` endpoint with Server-Sent Events
  - Frontend: real-time token rendering as LLM generates
- **Delete fix** — cascade delete of chunks (PostgreSQL + ChromaDB) before document removal

---

- **V1: CSV/XLSX file support** — extraction, upload, chunking for tabular data
- **V1: OCR Tesseract fallback** — scanned PDF text extraction via PyMuPDF + pytesseract
- **V1: Smart chunking** — heading/paragraph-aware chunking, structure-preserving splits
- **V1: Hybrid search** — BM25 keyword search + vector search with Reciprocal Rank Fusion
- **V1: LLM-based reranking** — Ollama reranks retrieved chunks by relevance before answer generation
- **V1: Conversation storage** — persistent chat sessions per document (create, resume, delete)
  - Backend: Conversation + ConversationMessage models, CRUD API
  - Frontend: conversation list in sidebar, auto-create, load history, save messages
- **V1 tests** — 48 unit tests passing (CSV, OCR, smart chunking, BM25, reranker)
- **V1 UI/UX redesign — "Aurora Glass"**
  - Gold + Purple Tech palette (OKLch, theme-aware light/dark)
  - Animated aurora mesh-gradient backgrounds
  - Glassmorphic cards with mouse-based 3D tilt (auth pages)
  - Framer Motion for scroll reveals + page transitions
  - DM Sans typography
  - Public landing page (`/`) and public About page (`/about`)
  - Redesigned auth, dashboard, chat, nav bar, drag-drop upload
  - `prefers-reduced-motion` compliance
  - Lenis smooth scroll removed (caused touchpad stalls)

---

## In Progress
- None

---

## V2 Scope (Next Phase)
1. Auto-generated document summaries on upload
2. Key insights extraction
3. Query history page
4. Multi-agent system (Ingestion, Retriever, QA, Summarizer agents)
5. PostgreSQL tsvector for persistent keyword search (replace in-memory BM25)

---

## V1 Scope (Completed)
1. ~~CSV/XLSX file support~~ ✓
2. ~~OCR Tesseract fallback~~ ✓
3. ~~Smart chunking~~ ✓
4. ~~Hybrid search (vector + BM25)~~ ✓
5. ~~LLM-based reranking~~ ✓
6. ~~Conversation storage~~ ✓

## MVP Scope (Completed)
1. ~~Backend skeleton~~ ✓
2. ~~Auth system~~ ✓
3. ~~Upload API~~ ✓
4. ~~Text extraction~~ ✓
5. ~~Ingestion pipeline~~ ✓
6. ~~RAG query pipeline~~ ✓
7. ~~Frontend MVP (login, dashboard, upload, chat)~~ ✓
8. ~~Backend tests~~ ✓
9. ~~Frontend tests~~ ✓
10. ~~MVP polish (error handling, logging)~~ ✓
