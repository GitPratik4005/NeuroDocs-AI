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

- Upload documents (PDF, DOCX)
- Extract and process content (including OCR for images)
- Convert documents into searchable knowledge
- Ask questions using natural language (RAG-based)
- Get answers with citations
- Generate:
  - summaries
  - key insights
  - simplified explanations
  - action suggestions

---

## 🚀 d. Milestones

---

### 🟢 MVP (Minimum Viable Product)

- User authentication (JWT)
- Upload PDF/DOCX
- Basic text extraction
- Basic ingestion pipeline:
  - chunking
  - embedding
- Basic RAG:
  - semantic search
  - Q&A
- Simple chat interface

---

### 🟡 V1 (Enhanced System)

- CSV and XLSX file support (tabular data extraction and chunking)
- OCR support for image-based documents
- Smart chunking (semantic + overlapping)
- Hybrid search:
  - vector + keyword
- Reranking of results
- Citations in answers
- Auto document summaries

---

### 🔵 V2 (Advanced AI System)

- Multi-agent architecture:
  - ingestion agent
  - retrieval agent
  - QA agent
  - summarizer agent
  - insight agent
  - memory agent

- Insight generation:
  - key points
  - risks
  - action suggestions
  - simplified explanations

- Memory system (context-aware queries)
- Enhanced dashboard UI

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
- Next.js (React)
- Tailwind CSS
- shadcn/ui

### Backend
- FastAPI (Python)

### Databases
- PostgreSQL → structured data (users, documents, queries)
- ChromaDB → vector embeddings

### AI / LLM
- Hybrid:
  - Local (Ollama)
  - API fallback (OpenAI or similar)

### OCR
- Tesseract (primary)
- Optional cloud fallback

### Other
- SQLAlchemy (ORM)
- Alembic (migrations)
- Docker (deployment)

---

## 🏗️ b. Technical Architecture

---

### 🔁 Data Flow

#### 📥 Document Ingestion

```text
Upload
→ File type detection
→ OCR (if needed)
→ Text extraction
→ Cleaning
→ Smart chunking
→ Metadata extraction
→ Embedding generation
→ Storage:
   - PostgreSQL (metadata)
   - ChromaDB (vectors)
```

#### 🔍 Query Processing

```text
User Query
→ Query processing / rewriting
→ Hybrid retrieval:
   - vector search (ChromaDB)
   - keyword search (PostgreSQL)
→ Reranking
→ Context selection
→ LLM response generation
→ Add citations
→ Store query in memory
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
  │   │   ├── query.py
  │   │   └── insights.py
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── auth_service.py
  │   │   ├── ocr_service.py
  │   │   ├── embedding_service.py
  │   │   └── rag_service.py
  │   ├── agents/
  │   │   ├── __init__.py
  │   │   ├── ingestion_agent.py
  │   │   ├── retriever_agent.py
  │   │   ├── qa_agent.py
  │   │   ├── summarizer_agent.py
  │   │   ├── insight_agent.py
  │   │   └── memory_agent.py
  │   ├── pipelines/
  │   │   ├── __init__.py
  │   │   ├── ingestion_pipeline.py
  │   │   └── query_pipeline.py
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── user.py
  │   │   ├── document.py
  │   │   ├── chunk.py
  │   │   └── query.py
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
  │   ├── app/
  │   │   ├── page.tsx
  │   │   ├── layout.tsx
  │   │   ├── login/
  │   │   │   └── page.tsx
  │   │   ├── dashboard/
  │   │   │   └── page.tsx
  │   │   ├── upload/
  │   │   │   └── page.tsx
  │   │   └── chat/
  │   │       └── page.tsx
  │   ├── components/
  │   │   ├── Navbar.tsx
  │   │   ├── DocumentList.tsx
  │   │   ├── ChatWindow.tsx
  │   │   └── InsightsPanel.tsx
  │   ├── lib/
  │   │   └── (shared utilities, auth helpers, formatters)
  │   ├── services/
  │   │   └── api.ts
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