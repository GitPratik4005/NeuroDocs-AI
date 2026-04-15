# NeuroDocAI

> **A private, local-first RAG platform that turns your documents into a cited, conversational knowledge base.**

Upload a PDF, DOCX, CSV, or XLSX — ask questions in natural language — get streamed answers grounded in the passages that matter, all running on your own hardware with no third-party AI provider in the loop.

---

## Status

**✅ V1 — Shipped and concluded** (merged to `main` on 2026-04-15)

The project has reached its stated V1 scope with all features working, **119 tests passing** (88 backend + 31 frontend), and complete documentation. See [`docs/STATUS.md`](docs/STATUS.md) for details and the list of possible future improvements.

---

## Features

### Document ingestion
- **Multi-format** — PDF, DOCX, CSV, XLSX
- **OCR fallback** — scanned PDFs are auto-detected and processed with PyMuPDF pixmap rendering + Tesseract
- **Smart chunking** — heading/paragraph-aware splits (500 chars, 50 overlap, 100 min) for PDF/DOCX; row-aware naive chunking for tabular data
- **Embedded** — chunks are embedded with `nomic-embed-text` and stored in ChromaDB alongside a BM25 keyword index

### Retrieval & answering
- **Hybrid retrieval** — Vector similarity (ChromaDB) + BM25 keyword search fused via Reciprocal Rank Fusion (k=60)
- **LLM reranking** — Top candidates are reranked by a local Ollama model before answer generation
- **Streaming answers** — Server-Sent Events stream LLM tokens in real time
- **Persistent conversations** — Chats are saved per document; resume, rename, or delete threads

### Experience
- **Aurora Glass UI** — Animated aurora mesh-gradient backgrounds, glassmorphic cards, Gold + Purple Tech palette
- **Framer Motion animations** — Orchestrated page transitions, scroll reveals, 3D tilt on auth cards
- **Light & dark themes** — Both fully supported with theme-aware OKLch color tokens
- **`prefers-reduced-motion` compliance** — Aurora drift, tilt, and stagger animations respect the OS setting
- **Public landing + About pages** — `/` and `/about` showcase the product without auth

### Privacy
- **100% local** — no cloud LLM, no third-party embedding service, no data ever leaves your machine

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui + Base UI, Framer Motion, DM Sans |
| **Backend** | FastAPI, Python 3.14, Pydantic v2, SQLAlchemy |
| **Databases** | PostgreSQL 18.3 (structured data), ChromaDB 1.5.5 (vector embeddings, embedded) |
| **Keyword search** | `rank_bm25` in-memory with Reciprocal Rank Fusion |
| **AI runtime** | Ollama (local) — default `qwen2:0.5b`, alternatives `llama3`, `phi3` |
| **Embeddings** | `nomic-embed-text` (Ollama) |
| **OCR** | PyMuPDF + Tesseract fallback |
| **Auth** | JWT + bcrypt |
| **Testing** | pytest (backend), Jest + React Testing Library (frontend) |
| **Deployment** | Docker |

---

## Architecture

### Ingestion pipeline
```
Upload (PDF / DOCX / CSV / XLSX)
 → File-type detection
 → Text extraction (PyMuPDF / python-docx / openpyxl + pandas)
    └─ OCR fallback on scanned pages (<50 chars/page → Tesseract)
 → Smart chunking (heading-aware for PDF/DOCX; naive 500/50 for CSV/XLSX)
 → Ollama embedding (nomic-embed-text)
 → Storage:
    • PostgreSQL (User, Document, Chunk, Conversation, ConversationMessage)
    • ChromaDB (vectors keyed by chunk id)
```

### Query pipeline
```
User query (optionally scoped to a doc_id)
 → Hybrid retrieval (4× candidate pool):
    • Vector search (ChromaDB)
    • BM25 keyword search (rank_bm25)
    └─ Reciprocal Rank Fusion (k=60)
 → LLM reranking (Ollama)
 → Context assembly
 → Ollama LLM answer generation (streamed via SSE)
 → Persist to Conversation + ConversationMessage
```

### Project structure
```
NeuroDocs-AI/
├── backend/
│   ├── api/             # auth, upload, query, conversations
│   ├── services/        # ocr, csv_extractor, chunking, embedding,
│   │                    # keyword_search (BM25), reranker, rag
│   ├── pipelines/       # ingestion_pipeline, query_pipeline
│   ├── models/          # SQLAlchemy models
│   ├── core/            # config, database, security, orchestrator
│   └── main.py
├── frontend/
│   └── src/
│       ├── app/         # Next.js App Router
│       │   ├── page.tsx             # Public landing
│       │   ├── about/page.tsx       # Public About page
│       │   ├── (auth)/              # login, register
│       │   └── (app)/               # dashboard, chat (protected)
│       ├── components/  # nav-bar, aurora-background, glass-card, ui/
│       ├── context/     # auth-context
│       ├── services/    # api.ts
│       └── lib/         # motion.ts, utils.ts
├── tests/
│   └── backend/         # pytest suite
├── docs/                # PROJECT_SPEC, API_SPEC, STATUS, CHANGELOG
├── docker/              # docker-compose + Dockerfiles
└── CLAUDE.md            # Operating rules for Claude Code
```

---

## Prerequisites

- **Python** 3.14+
- **Node.js** 20+
- **PostgreSQL** 18.x (this project uses port **5433** by default)
- **ChromaDB** — installed via pip (embedded mode)
- **Ollama** — with models pulled: `ollama pull nomic-embed-text && ollama pull qwen2:0.5b`
- **Tesseract** (optional but recommended for scanned PDFs)

---

## Setup

### 1. Clone and configure
```bash
git clone https://github.com/GitPratik4005/NeuroDocs-AI.git
cd NeuroDocs-AI
cp .env.example .env     # fill in DB URL, secrets, etc.
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at `http://localhost:8000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:3000`.

### 4. Docker (alternative)
```bash
docker compose -f docker/docker-compose.yml up
```

---

## Usage

1. Open `http://localhost:3000`
2. Register an account → sign in
3. Drag a PDF/DOCX/CSV/XLSX into the dashboard
4. Click the document → land in the chat view
5. Ask a question — or use the preset actions (Summarize, Key Points, Change Tone)
6. Watch the answer stream in. Your conversation is saved automatically.

---

## Testing

```bash
# Backend — 88 tests
cd tests/backend && pytest

# Frontend — 31 tests
cd frontend && npm test
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) | Product requirements, milestones, architecture, project structure |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | Backend API endpoints and schemas |
| [`docs/STATUS.md`](docs/STATUS.md) | Current project status, shipped scope, future improvements |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history |
| [`CLAUDE.md`](CLAUDE.md) | Operating rules for Claude Code (agent-assisted development) |

---

## Possible Future Improvements

These were originally scoped as "V2" but are retained as a backlog rather than an active phase — see [`docs/STATUS.md`](docs/STATUS.md) for details:

- Auto-generated document summaries on upload
- Key insights extraction (key points, risks, action suggestions, simplified explanations)
- Query history page
- Multi-agent architecture (Ingestion, Retriever, QA, Summarizer, Insight, Memory agents)
- Memory system for context-aware queries across conversations
- PostgreSQL `tsvector` to replace in-memory BM25 for persistent keyword search
- Citations tied directly to source passages in answers

---

## License

No license file present — treat as proprietary / all rights reserved until one is added.
