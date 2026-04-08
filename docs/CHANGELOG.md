# Changelog

All notable changes to this project are documented here.

Format:
- Latest entries appear at the top
- Each entry includes a timestamp
---

## [Unreleased]

### Added
- **Streaming responses**: SSE-based token streaming for chat answers
  - Backend `/api/query/stream` endpoint using Ollama streaming API
  - Frontend reads stream and renders tokens in real-time (ChatGPT/Claude-like UX)
- **Frontend redesign**: premium single-page experience with dark/light/system theme
  - Drag-and-drop upload on main dashboard (replaces separate upload page)
  - Chat split view: document preview panel (left) + chat window (right)
  - Predefined chat actions: Summarize, Key Points, Change Tone (Professional/Casual/Academic/Simple)
  - Dark/light/system theme toggle using next-themes
  - Branded loading states, hover glow effects, bouncing dots animation
  - Live password requirements indicator on register page
  - File size validation (10MB max) on client side
  - Delete confirmation dialog (browser confirm)
- **Frontend tests**: 31 tests passing (Jest + React Testing Library)
  - API service, nav bar, drag-drop upload, login, register page tests
- **Frontend MVP**: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
  - Login and Register pages with email/password forms
  - Dashboard page with document table, status badges, pagination, delete
  - Chat page with Q&A interface, session message history
  - Auth context with JWT token management and route guards
  - API service layer using native fetch for all backend endpoints
- **Backend tests**: 30 tests passing (unit + API + RAG)
  - Auth API, Upload API, Query API, Chunking, OCR service tests

### Changed
- Frontend: single-page architecture (dashboard + upload merged, chat via /chat?doc=id)
- Frontend: nav bar simplified to logo + theme toggle + user logout (no page links)
- Frontend: auth pages restyled with premium dark-compatible design
- Frontend: chat queries now scoped to selected document via doc_id
- Frontend: violet/blue accent color scheme for futuristic feel
- Ingestion pipeline: improved chunking with min chunk size (100 chars), smart sentence boundary detection
- RAG service: increased Ollama LLM timeout from 120s to 300s
- Upload API: fixed `status_filter` typing, explicit `model_validate` for document list
- Config: switched default LLM model from llama3 to phi3 for faster responses

### Fixed
- Document delete: cascade delete chunks from PostgreSQL and ChromaDB before removing document
- Chunking bug: periods in abbreviations (e.g., "Next.js") caused tiny duplicate chunks
- Upload API: `status_filter: str = None` deprecation issue in newer FastAPI

### Removed
- Separate upload page (merged into dashboard drag-drop zone)

### Previously Added
- **Backend skeleton**: FastAPI app with CORS, Pydantic Settings config, SQLAlchemy database setup
- **Auth system**: User model, JWT auth (bcrypt), register/login/me endpoints
- **Document upload**: Document model, POST/GET/DELETE endpoints, file type and size validation
- **Text extraction**: PDF extraction (PyMuPDF), DOCX extraction (python-docx), dispatcher
- **Ingestion pipeline**: Chunk model, Ollama embedding service, chunking (500/50 overlap), ChromaDB storage, background task trigger
- **RAG query pipeline**: QueryRecord model, semantic retrieval from ChromaDB, Ollama LLM answer generation, query history endpoint
- Knowledge documentation: code_explanations.md, system_explanations.md
- .env.example with all required environment variables (DB, ChromaDB, Ollama, JWT, uploads)
- .env configured with actual connection strings and generated secrets
- CSV/XLSX file support added to V1 roadmap

### Previously Changed
- CLAUDE.md: added doc links, constraints & policies, build rules, expanded testing strategy, CSV/XLSX V1 note
- commands/update-knowledge.md: updated to write to single files (code_explanations.md, system_explanations.md)
- agents/knowledge_agent.md: aligned output structure with update-knowledge command

---

## [0.0.1] — 2026-03-25

### Added
- Initial project setup
- GitHub repo (GitPratik4005/NeuroDocs-AI)
- CLAUDE.md with operating rules, architecture reference, tech decisions
- PROJECT_SPEC.md with full PRD, milestones, tech stack, data flows, project structure
- API_SPEC.md with all MVP endpoint definitions
- STATUS.md, CHANGELOG.md
- Commands: build-mvp, build-feature, whats-next, update-knowledge
- Agents: explore_agent, knowledge_agent
- Skills: rag_skill, backend_architecture
- Hooks: post-task.sh
- .gitignore, README.md
- Python venv (3.13.0)
- PostgreSQL 18.3 (port 5433, neurodocai DB)
- ChromaDB 1.5.5 (embedded)
- Ollama models: llama3, nomic-embed-text

---

## Format

- Added → new features
- Changed → updates
- Fixed → bug fixes

## Rules

- Always add new entries at the TOP
- Use clear, meaningful descriptions
- Do not log trivial changes (e.g., renaming variables)
- Group related changes in one entry