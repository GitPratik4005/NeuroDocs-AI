# NeuroDocAI – Project Specification

---

# 🧾 1. PRD – Product Requirements Document

---

## 👤 a. Who is the product for?

### Primary Users:
- Students & Researchers → analyze study material, PDFs, notes
- Professionals → extract insights from reports, contracts, documents
- General Users → search and understand personal or work documents

---

## ❗ b. What problems does it solve?

- Difficulty in searching large documents
- Time-consuming manual reading
- Lack of structured insights from unstructured data
- No easy way to "chat" with documents
- Hard to extract key points, summaries, and risks

---

## ⚙️ c. What does it do?

NeuroDocAI allows users to:

- Upload documents (PDF, DOCX, CSV, XLSX)
- Extract and process content (including OCR for scanned/image-based PDFs)
- Convert documents into searchable knowledge (hybrid vector + keyword index)
- Ask questions using natural language (RAG-based, streaming responses)
- Get answers with cited passages
- Resume persistent conversations per document
- Future (V2): generate summaries, key insights, simplified explanations, action suggestions

---

## 🚀 d. Milestones

---

### 🟢 MVP — ✅ Shipped

- User authentication (JWT + bcrypt)
- Upload PDF/DOCX
- Basic text extraction (PyMuPDF, python-docx)
- Basic ingestion pipeline: chunking + Ollama embedding + ChromaDB storage
- Basic RAG: semantic retrieval + Ollama Q&A
- Next.js frontend: login, register, dashboard, chat
- Streaming responses (SSE)
- Backend + frontend test suites

---

### 🟡 V1 (Enhanced System) — ✅ Shipped

- CSV and XLSX file support (tabular data extraction and chunking)
- OCR support for scanned/image-based PDFs (PyMuPDF + Tesseract fallback)
- Smart chunking (heading/paragraph-aware, sentence-boundary splits)
- Hybrid search: vector (ChromaDB) + BM25 keyword search fused via Reciprocal Rank Fusion
- LLM-based reranking (Ollama ranks candidates before answer generation)
- Persistent conversations per document (create/resume/delete from sidebar)
- "Aurora Glass" UI/UX redesign: animated aurora backgrounds, glassmorphic cards, Gold + Purple Tech palette, Framer Motion animations, DM Sans, public landing + About pages

---

### 🔵 V2 (Advanced AI System) — 🔜 Planned

- Auto-generated document summaries on upload
- Key insights extraction (key points, risks, action suggestions, simplified explanations)
- Query history page
- Multi-agent architecture:
  - ingestion agent
  - retriever agent
  - QA agent
  - summarizer agent
  - insight agent
  - memory agent
- Memory system (context-aware queries across conversations)
- PostgreSQL `tsvector` for persistent keyword search (replace in-memory BM25)
- Citations tied to source passages in answers

---

### 🚀 Later (Future Scope)

- Multi-document comparison
- Role-based access control
- Cloud deployment
- Real-time document monitoring
- Dynamic model routing (LLM selection)

---

# ⚙️ 2. EDD – Engineering Design Document

---

## 🧱 a. Tech Stack

### Frontend
- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 (custom `@utility` blocks for Aurora Glass)
- shadcn/ui + Base UI primitives
- Framer Motion (animations, 3D tilt, scroll reveals)
- next-themes (dark/light/system toggle)
- DM Sans (body) + Geist Mono (code)

### Backend
- FastAPI (Python 3.14)
- Pydantic v2 for schemas/settings

### Databases
- PostgreSQL 18.3 → structured data (users, documents, chunks, queries, conversations, messages)
- ChromaDB 1.5.5 (embedded) → vector embeddings

### AI / LLM
- **Ollama only (local)** — no cloud/API fallback
- Default LLM: `qwen2:0.5b`; alternatives: `llama3`, `phi3`
- Embeddings: `nomic-embed-text`
- LLM reranking before answer generation

### Retrieval
- Hybrid: vector (ChromaDB) + BM25 (`rank_bm25`, in-memory) → RRF fusion (k=60) → LLM rerank

### OCR
- PyMuPDF (primary pixmap rendering)
- Tesseract via `pytesseract` (fallback for scanned PDFs, <50 chars/page)
- No cloud OCR fallback

### Other
- SQLAlchemy (ORM, no Alembic migrations for now)
- Docker (deployment)
- Tests: pytest (backend) + Jest + React Testing Library (frontend)

---

## 🏗️ b. Technical Architecture

---

### 🔁 Data Flow

#### 📥 Document Ingestion

```text
Upload (PDF / DOCX / CSV / XLSX)
→ File type detection
→ Text extraction
   - PDF: PyMuPDF, with Tesseract OCR fallback on scanned pages
   - DOCX: python-docx
   - CSV / XLSX: pipe-separated row text, sheet headers for XLSX
→ Smart chunking (heading/paragraph-aware for PDF/DOCX; naive 500/50 for CSV/XLSX)
→ Ollama embedding (nomic-embed-text)
→ Storage:
   - PostgreSQL (User, Document, Chunk, Conversation, ConversationMessage)
   - ChromaDB (vectors, keyed by chunk id)
```

#### 🔍 Query Processing

```text
User Query (optionally scoped to a doc_id)
→ Hybrid retrieval (4× candidate pool):
   - vector search (ChromaDB)
   - BM25 keyword search (rank_bm25, in-memory)
   → Reciprocal Rank Fusion (k=60)
→ LLM rerank (Ollama ranks top candidates by relevance)
→ Context assembly
→ Ollama LLM answer generation (streamed via SSE)
→ Persist to Conversation + ConversationMessage
```

---

## 🗂️ c. Project Structure

NeuroDocs-AI/
  │
  ├── backend/
  │   ├── api/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── upload.py
  │   │   ├── query.py             # /query, /query/stream (SSE), /query/history
  │   │   └── conversations.py     # GET/POST/DELETE conversations + messages
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── auth_service.py
  │   │   ├── ocr_service.py       # PyMuPDF + Tesseract fallback
  │   │   ├── csv_extractor.py     # CSV/XLSX → pipe-separated text
  │   │   ├── chunking_service.py  # smart (heading-aware) + naive
  │   │   ├── embedding_service.py # Ollama nomic-embed-text
  │   │   ├── keyword_search.py    # BM25Okapi in-memory index
  │   │   ├── reranker.py          # Ollama LLM reranking
  │   │   └── rag_service.py
  │   ├── agents/                  # V2 scope (empty for now)
  │   ├── pipelines/
  │   │   ├── __init__.py
  │   │   ├── ingestion_pipeline.py
  │   │   └── query_pipeline.py    # hybrid retrieve → rerank → generate
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── user.py
  │   │   ├── document.py
  │   │   ├── chunk.py
  │   │   ├── query.py
  │   │   ├── conversation.py
  │   │   └── conversation_message.py
  │   ├── core/
  │   │   ├── __init__.py
  │   │   ├── config.py
  │   │   ├── database.py
  │   │   ├── security.py
  │   │   └── orchestrator.py
  │   ├── main.py
  │   └── requirements.txt
  │
  ├── frontend/
  │   ├── src/
  │   │   ├── app/
  │   │   │   ├── layout.tsx            # DM Sans, ThemeProvider, AuthProvider
  │   │   │   ├── page.tsx              # Public landing (Aurora Glass)
  │   │   │   ├── globals.css           # Tailwind v4 + @utility glass/aurora/gold-text
  │   │   │   ├── about/page.tsx        # Public About page
  │   │   │   ├── (auth)/
  │   │   │   │   ├── login/page.tsx
  │   │   │   │   └── register/page.tsx
  │   │   │   └── (app)/
  │   │   │       ├── layout.tsx        # AuroraBackground + NavBar
  │   │   │       ├── dashboard/page.tsx
  │   │   │       └── chat/page.tsx
  │   │   ├── components/
  │   │   │   ├── ui/                   # shadcn + Base UI (button, card, input, ...)
  │   │   │   │   └── glass-card.tsx    # glass + optional 3D tilt
  │   │   │   ├── motion/
  │   │   │   │   ├── fade-in.tsx
  │   │   │   │   └── stagger-list.tsx
  │   │   │   ├── auth-guard.tsx
  │   │   │   ├── aurora-background.tsx
  │   │   │   ├── drag-drop-upload.tsx
  │   │   │   ├── nav-bar.tsx           # floating glass pill
  │   │   │   ├── theme-provider.tsx
  │   │   │   └── theme-toggle.tsx
  │   │   ├── context/auth-context.tsx  # JWT state
  │   │   ├── lib/
  │   │   │   ├── utils.ts              # cn()
  │   │   │   └── motion.ts             # shared Framer Motion variants
  │   │   ├── services/api.ts
  │   │   ├── types/index.ts
  │   │   └── __tests__/                # Jest + RTL
  │   ├── package.json
  │   └── tsconfig.json
  │
  ├── commands/
  │   ├── build-mvp.md
  │   ├── build-feature.md
  │   ├── upgrade-version.md
  │   ├── whats-next.md
  │   ├── review-work.md
  │   ├── iterate-until-success.md
  │   ├── update-knowledge.md
  │   ├── explain-file.md
  │   ├── commit-and-push.md
  │   └── create-pr.md
  │
  ├── skills/
  │   ├── rag_skill.md
  │   ├── document_parsing.md
  │   └── backend_architecture.md
  │
  ├── agents/
  │   ├── ingestion_agent.md
  │   ├── rag_agent.md
  │   ├── qa_agent.md
  │   ├── knowledge_agent.md
  │   ├── explore_agent.md
  │   └── feedback_agent.md
  │
  ├── hooks/
  │   └── post-task.sh
  │
  ├── docs/
  │   ├── PROJECT_SPEC.md
  │   ├── ARCHITECTURE.md
  │   ├── API_SPEC.md
  │   ├── CHANGELOG.md
  │   └── STATUS.md
  │
  ├── knowledge/
  │   ├── code_explanations/
  │   └── system_explanations/
  │
  ├── tests/
  │   ├── backend/
  │   └── frontend/
  │
  ├── docker/
  │   ├── Dockerfile.backend
  │   ├── Dockerfile.frontend
  │   └── docker-compose.yml
  │
  ├── .env
  ├── .gitignore
  ├── CLAUDE.md
  └── README.md