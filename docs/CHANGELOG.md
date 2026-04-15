# Changelog

All notable changes to this project are documented here.

Format:
- Latest entries appear at the top
- Each entry includes a timestamp
---

## [Unreleased]

### Added (V1 UI/UX — "Aurora Glass" redesign)
- **Aurora Glass design system**: animated mesh-gradient backgrounds + glassmorphic cards
  - `aurora-background.tsx` — full-screen animated radial gradients with `aurora-drift` keyframe (18s)
  - `glass-card.tsx` — backdrop-blur translucent cards with optional mouse-based 3D tilt (Framer Motion `useMotionValue` + `useSpring`)
  - Tailwind v4 custom utilities in `globals.css`: `glass-card`, `glass-panel`, `aurora-bg`, `aurora-veil`, `gold-text`
- **Gold + Purple Tech palette**: OKLch tokens for light + dark themes
  - Brand: `--gold`, `--gold-soft`, `--purple-cta`, `--purple-soft`
  - Theme-aware gold gradient (`--gold-a/b/c`) with 6s shimmer animation
  - Aurora stops (`--aurora-1..4`) and glass tokens flip between light/dark
- **Framer Motion** (12.x) for orchestrated animations
  - Shared variants in `lib/motion.ts`: `fadeIn`, `slideUp`, `staggerContainer`, `staggerItem`, `easeOut`
  - Scroll reveals via `whileInView` + `viewport: { once: true }`
  - Page-level mount transitions on auth + landing pages
- **Typography swap**: Geist Sans → DM Sans (via `next/font/google`); Geist Mono retained for code
- **Public landing page** (`/`): hero, description, 6-feature stagger grid, 3-step timeline, tech stack, CTA, footer
- **Public About page** (`/about`): Functionalities (8 cards), Build information (4 categories), Milestones (MVP/V1/V2)
- **Redesigned pages**:
  - Auth (login/register): aurora background + glass card with 3D tilt + animated password rules
  - Dashboard: gold-text hero, glass-wrapped table (desktop), staggered card grid (mobile)
  - Chat: glass split panels, conversation sidebar with gold/purple active ring, purple user bubbles, pulsing gold orb loader (replaces bouncing dots), pill input with backdrop blur
  - NavBar: floating glass pill (`sticky top-4`, rounded-full) with animated sun/moon toggle and `/about` link
  - Drag-drop upload: gold border states, purple upload button
- **Accessibility**: `prefers-reduced-motion` disables aurora drift, 3D tilt, stagger delays

### Changed (V1 UI/UX)
- `(app)/layout.tsx` wraps content with `AuroraBackground intensity="normal"` + floating NavBar
- Button variants extended: added `gold`, `purple`, `glass`
- Register button label: "Register" → "Create Account"
- Drag-drop error message reflects CSV/XLSX support ("Only PDF, DOCX, CSV, and XLSX files are supported")
- Updated Jest tests (`register.test.tsx`, `drag-drop-upload.test.tsx`) to match new copy

### Fixed (V1 UI/UX)
- Removed Lenis smooth-scroll provider: caused scroll stalls on Windows precision touchpads due to inertial wheel events. Native browser scrolling restored; Framer Motion scroll reveals unaffected.
- Gold text / aurora invisibility in light mode: theme-aware OKLch gradient stops + reduced veil opacity so accents render richly on white background

### Added (V1)
- **CSV/XLSX file support**: upload and query tabular data files
  - `csv_extractor.py` — converts CSV rows to readable pipe-separated text
  - XLSX extraction reads all sheets with sheet name headers
  - Updated upload API, frontend drag-drop to accept .csv/.xlsx
- **OCR Tesseract fallback**: scanned PDFs now extract text via OCR
  - Detects pages with <50 chars text as scanned
  - Falls back to PyMuPDF pixmap → PIL → pytesseract
  - Gracefully skips if pytesseract not installed
- **Smart chunking**: heading/paragraph-aware text splitting
  - Detects Markdown headings, numbered sections, ALL CAPS headings
  - Keeps headings attached to following content
  - Splits oversized paragraphs at sentence boundaries
  - CSV/XLSX uses naive chunking; PDF/DOCX uses smart chunking
- **Hybrid search**: vector + BM25 keyword search with Reciprocal Rank Fusion
  - `keyword_search.py` — in-memory BM25Okapi search over chunk texts
  - RRF fusion: `1/(k + rank_vector) + 1/(k + rank_bm25)` with k=60
  - Retrieves 4x candidates, fuses scores, selects top results
- **LLM-based reranking**: Ollama reranks top chunks by relevance
  - `reranker.py` — prompts LLM to rank passages, parses numbered response
  - Falls back to hybrid scores if LLM fails
- **Conversation storage**: persistent chat sessions per document
  - `Conversation` + `ConversationMessage` models (PostgreSQL)
  - `GET/POST/DELETE /api/conversations` + message endpoints
  - Frontend: conversation list in sidebar, auto-create, resume, delete
  - Messages saved to backend after each exchange
- **V1 tests**: 48 unit tests (CSV extractor, OCR dispatch, smart chunking, BM25, reranker)

### Changed (V1)
- Query pipeline now uses hybrid_retrieve → rerank → generate_answer
- Ingestion pipeline uses smart_chunk for PDF/DOCX, chunk_text for CSV/XLSX
- Chunking logic extracted from ingestion_pipeline.py to chunking_service.py

### Added (MVP — previously)
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