# Code Explanations

---

## CLAUDE.md

### Purpose
Central instruction file loaded every Claude Code session. Defines operating rules, commands, architecture, tech decisions, and constraints.

### Flow
Session starts → CLAUDE.md auto-loaded → rules enforced → commands/agents/skills available.

### Key Concepts
- RPIT loop enforced (Research → Plan → Implement → Test)
- Phase-gated: MVP → V1 → V2 → Future
- Layer separation: api/ → services/ → pipelines/ → models/
- PostgreSQL only (no SQLite), SQLAlchemy ORM, no Alembic yet
- Embeddings: Ollama nomic-embed-text only, no cloud fallback
- Agents: custom-built, no LangChain/CrewAI
- Frontend: shadcn/ui + Tailwind CSS, no custom UI unless necessary

### Dependencies
docs/PROJECT_SPEC.md, docs/API_SPEC.md, docs/STATUS.md, docs/CHANGELOG.md

### Why It Matters
Single source of truth for Claude Code behavior. Prevents scope creep, enforces consistency across sessions.

---

## commands/

### Purpose
Slash commands that define repeatable workflows.

### Flow
User types /command → Claude reads the .md → follows defined steps.

### Key Concepts
- `build-mvp.md` — Build MVP features only, uses RPIT, reads PROJECT_SPEC for scope
- `build-feature.md` — Single feature implementation via RPIT, uses Explore Agent for research
- `whats-next.md` — Reads PROJECT_SPEC + STATUS → outputs prioritized task list
- `update-knowledge.md` — Documents changed files into knowledge/code_explanations.md and knowledge/system_explanations.md

### Dependencies
PROJECT_SPEC.md (scope), STATUS.md (progress), knowledge/ (output)

### Why It Matters
Standardizes how features are built. Prevents skipping research or testing steps.

---

## agents/

### Purpose
Agent definitions Claude Code delegates to for specialized tasks.

### Flow
Claude identifies need → spawns agent → agent performs task → returns result.

### Key Concepts
- `explore_agent.md` — Searches codebase before changes, identifies dependencies and structure
- `knowledge_agent.md` — Documents what was built into knowledge/ using 5-point format (Purpose, Flow, Key Concepts, Dependencies, Why It Matters). Triggered after features or via /update-knowledge.

### Dependencies
Explore reads existing code. Knowledge writes to knowledge/.

### Why It Matters
Explore prevents blind coding. Knowledge keeps docs current automatically.

---

## skills/

### Purpose
Domain knowledge reference files loaded when relevant to a task.

### Flow
Claude detects relevant context → loads skill → uses as reference during implementation.

### Key Concepts
- `rag_skill.md` — RAG concepts: small overlapping chunks, top-k retrieval, always cite sources, keep context clean
- `backend_architecture.md` — Layer flow (api → services → pipelines → models), directory responsibilities, data storage mapping, architectural rules

### Dependencies
None — reference material only.

### Why It Matters
Gives Claude domain expertise without re-deriving from code each session.

---

## hooks/post-task.sh

### Purpose
Shell script that auto-runs after every completed task.

### Flow
Task completes → runs pytest → triggers /update-knowledge.

### Key Concepts
Automated testing + knowledge documentation after every task.

### Dependencies
pytest installed, knowledge/ directory exists.

### Why It Matters
Catches regressions immediately. Keeps knowledge docs in sync with code changes.

---

## .env.example

### Purpose
Template for environment variables. Committed to git (unlike .env).

### Key Concepts
- APP: name, env, debug, secret key
- PostgreSQL: DATABASE_URL (port 5433)
- ChromaDB: host + port
- Ollama: base URL, embedding model (nomic-embed-text), LLM model (llama3)
- JWT: secret, algorithm (HS256), expiry (30 min)
- Upload: max size (50MB), upload directory

### Why It Matters
New developers can copy to .env and fill in values. Documents all required config.

---

## .gitignore

### Purpose
Prevents sensitive/generated files from being committed.

### Key Concepts
Covers: .env, __pycache__, venv/, node_modules/, .next/, IDE files, OS files, .pytest_cache/, docker data, knowledge/ generated content.

### Why It Matters
Prevents secrets and large generated files from entering git history.

---

## backend/core/config.py

### Purpose
Centralized configuration using Pydantic Settings. Reads all env vars from `.env` file.

### Flow
App starts → `Settings()` loads `.env` → `settings` singleton used everywhere via `from core.config import settings`.

### Key Concepts
- Pydantic `BaseSettings` auto-validates types and provides defaults
- `env_file` path resolved relative to config.py's location (goes up to project root)
- Covers: DB URL, ChromaDB, Ollama (base URL + models), JWT (secret, algorithm, expiry), uploads (max size, directory)

### Dependencies
`.env` file at project root, `pydantic-settings` package.

### Why It Matters
Single source of truth for all config. Type-safe, no scattered `os.getenv()` calls.

---

## backend/core/database.py

### Purpose
SQLAlchemy engine, session factory, and declarative base for all models.

### Flow
`engine` created from `DATABASE_URL` → `SessionLocal` factory → `get_db()` yields sessions per request → auto-closes after.

### Key Concepts
- `create_engine(settings.DATABASE_URL)` — connects to PostgreSQL
- `SessionLocal` — `autocommit=False, autoflush=False` for explicit transaction control
- `Base(DeclarativeBase)` — all models inherit from this for table creation
- `get_db()` — FastAPI dependency, yields session, closes in `finally` block

### Dependencies
`core/config.py` for DATABASE_URL, `sqlalchemy` package.

### Why It Matters
All DB access goes through this module. `get_db()` ensures sessions are properly managed per request.

---

## backend/core/security.py

### Purpose
Password hashing (bcrypt), JWT token creation/validation, and `get_current_user` dependency.

### Flow
Register: `hash_password()` → store hash. Login: `verify_password()` → `create_access_token()`. Protected routes: `get_current_user()` extracts user from JWT in Authorization header.

### Key Concepts
- Uses `bcrypt` directly (not passlib — incompatible with bcrypt 4.x)
- `bcrypt.hashpw()` / `bcrypt.checkpw()` for password operations
- JWT payload: `{"sub": user_id, "exp": expiry}` signed with HS256
- `OAuth2PasswordBearer(tokenUrl="/api/auth/login")` — extracts Bearer token from header
- `get_current_user` — decodes JWT, queries User from DB, raises 401 on failure

### Dependencies
`bcrypt`, `python-jose[cryptography]`, `core/config.py`, `core/database.py`, `models/user.py`.

### Why It Matters
Central auth mechanism. Every protected endpoint depends on `get_current_user`.

---

## backend/models/user.py

### Purpose
SQLAlchemy model for the `users` table.

### Key Concepts
- `id` — UUID string, auto-generated via `uuid.uuid4()`
- `email` — unique, indexed for fast login lookups
- `name` — display name
- `hashed_password` — bcrypt hash, never stores plaintext
- `created_at` — timezone-aware UTC timestamp
- Uses SQLAlchemy 2.0 `Mapped[]` / `mapped_column()` syntax

### Dependencies
`core/database.py` (Base class).

### Why It Matters
Foundation for auth. All other models reference `users.id` via foreign keys.

---

## backend/models/document.py

### Purpose
SQLAlchemy model for the `documents` table. Tracks uploaded files.

### Key Concepts
- `id` — UUID string primary key
- `user_id` — FK to `users.id`, indexed for per-user queries
- `title` — display name (defaults to filename)
- `file_type` — "pdf" or "docx"
- `file_path` — physical path: `./uploads/<user_id>/<uuid>.<ext>`
- `status` — lifecycle: "processing" → "ready" or "failed"
- `chunk_count` — updated after ingestion completes

### Dependencies
`core/database.py` (Base), references `users.id`.

### Why It Matters
Central record for every uploaded document. Status field drives UI display and ingestion tracking.

---

## backend/models/chunk.py

### Purpose
SQLAlchemy model for the `chunks` table. Stores text chunks from ingested documents.

### Key Concepts
- `id` — UUID string, also used as ChromaDB embedding ID
- `document_id` — FK to `documents.id`, indexed
- `content` — the actual text chunk (Text column for large content)
- `chunk_index` — ordering within the document
- `page_number` — optional, for future page-level tracking
- `embedding_id` — references the ChromaDB vector (set to chunk ID)

### Dependencies
`core/database.py` (Base), references `documents.id`.

### Why It Matters
Links PostgreSQL text storage to ChromaDB vector storage. Enables retrieval of actual text after semantic search.

---

## backend/models/query.py

### Purpose
SQLAlchemy model for the `queries` table. Stores RAG query history.

### Key Concepts
- `question` / `answer` — Text columns for the Q&A pair
- `source_chunks` — JSON string of chunk IDs used to generate the answer
- `document_ids` — JSON string of document IDs the answer drew from
- Helper methods `get_source_chunks()` / `get_document_ids()` parse JSON strings back to lists

### Dependencies
`core/database.py` (Base), references `users.id`.

### Why It Matters
Enables query history feature. JSON fields avoid needing a separate join table for MVP.

---

## backend/services/auth_service.py

### Purpose
Business logic for user registration and authentication.

### Flow
Register: check duplicate email → hash password → create User → commit. Login: find user by email → verify password → create JWT → return token.

### Key Concepts
- `register_user()` — raises 400 if email exists, returns User object
- `authenticate_user()` — raises 401 on bad credentials, returns `{"access_token": ..., "token_type": "bearer"}`
- Passwords never compared in plaintext — always via `verify_password()`

### Dependencies
`models/user.py`, `core/security.py`.

### Why It Matters
Separates auth logic from route handlers. Routes stay thin, logic is testable independently.

---

## backend/services/ocr_service.py

### Purpose
Text extraction from PDF and DOCX files. MVP: direct extraction only (no OCR).

### Flow
`extract_text(file_path, file_type)` dispatches to the correct extractor based on file type.

### Key Concepts
- `extract_text_from_pdf()` — uses PyMuPDF (`fitz`), iterates pages, joins non-empty text
- `extract_text_from_docx()` — uses `python-docx`, extracts paragraph text, joins non-empty
- Dispatcher pattern: `{"pdf": fn, "docx": fn}` lookup, raises ValueError for unsupported types
- Named `ocr_service` for future OCR expansion in V1

### Dependencies
`PyMuPDF` (fitz), `python-docx`.

### Why It Matters
Entry point for the ingestion pipeline. All document content flows through this service.

---

## backend/services/embedding_service.py

### Purpose
Generates vector embeddings via Ollama's nomic-embed-text model.

### Flow
Text → HTTP POST to Ollama `/api/embed` → returns 768-dim float vector.

### Key Concepts
- `generate_embedding(text)` — single text, returns `list[float]`
- `generate_embeddings(texts)` — batch, sends all texts in one request for efficiency
- Uses `httpx` for HTTP calls with generous timeouts (60s single, 120s batch)
- Ollama endpoint: `{OLLAMA_BASE_URL}/api/embed`

### Dependencies
`httpx`, `core/config.py` (Ollama URL + model name), Ollama running locally.

### Why It Matters
Embeddings power semantic search. Batch method reduces HTTP overhead during ingestion.

---

## backend/services/rag_service.py

### Purpose
RAG retrieval and LLM answer generation.

### Flow
Question → embed → query ChromaDB → get relevant chunks → send to Ollama LLM → return answer.

### Key Concepts
- `retrieve_relevant_chunks()` — embeds question, queries ChromaDB with `user_id` filter (and optional `document_ids` filter), returns top-5 chunks with distances
- `generate_answer()` — builds prompt with context + question, calls Ollama `/api/chat` (llama3, non-streaming), extracts answer from response
- Prompt instructs LLM to answer ONLY from context and say so if info is insufficient

### Dependencies
`embedding_service.py`, `ingestion_pipeline.py` (for ChromaDB collection), `httpx`, Ollama.

### Why It Matters
Core RAG logic. Retrieval quality directly determines answer quality.

---

## backend/pipelines/ingestion_pipeline.py

### Purpose
Orchestrates document ingestion: extract → chunk → embed → store.

### Flow
`run_ingestion(db, document_id)` → load Document → extract text → chunk → batch embed → store chunks in PostgreSQL + ChromaDB → update document status.

### Key Concepts
- `chunk_text()` — splits at 500 chars with 50 char overlap, respects sentence boundaries (breaks at `.` or ` `)
- `get_chroma_collection()` — `PersistentClient(path="./chroma_data")`, collection named "neurodocai"
- ChromaDB metadata: `{document_id, user_id, chunk_index}` — enables per-user and per-document filtering
- Chunk ID used as both PostgreSQL PK and ChromaDB embedding ID
- On failure: sets `doc.status = "failed"`, re-raises exception
- On success: sets `doc.status = "ready"`, updates `doc.chunk_count`

### Dependencies
`ocr_service`, `embedding_service`, `models/chunk.py`, `models/document.py`, ChromaDB.

### Why It Matters
The entire ingestion flow in one function. Triggered as a background task after upload.

---

## backend/pipelines/query_pipeline.py

### Purpose
Orchestrates RAG query: retrieve → generate → save.

### Flow
`run_query(db, user_id, question, document_ids)` → retrieve chunks → generate answer → save QueryRecord → return result dict.

### Key Concepts
- Calls `retrieve_relevant_chunks()` for semantic search
- If no chunks found, returns a "no relevant info" fallback message without calling LLM
- Deduplicates document IDs from chunk metadata
- Saves full query record (question, answer, source chunk IDs, document IDs) to PostgreSQL
- Returns dict with all fields needed by the API response schema

### Dependencies
`rag_service`, `models/query.py`.

### Why It Matters
Single entry point for the query flow. Separates orchestration from retrieval/generation logic.

---

## backend/api/auth.py

### Purpose
Route handlers for authentication endpoints.

### Key Concepts
- `POST /api/auth/register` — accepts email/password/name, returns UserResponse (201)
- `POST /api/auth/login` — accepts email/password, returns TokenResponse with JWT
- `GET /api/auth/me` — requires Bearer token, returns current user profile
- Pydantic schemas: RegisterRequest, LoginRequest, UserResponse, TokenResponse
- `model_config = {"from_attributes": True}` enables ORM → Pydantic conversion

### Dependencies
`services/auth_service.py`, `core/security.py`, `core/database.py`.

### Why It Matters
Thin route layer. All logic delegated to auth_service.

---

## backend/api/upload.py

### Purpose
Route handlers for document upload and management.

### Key Concepts
- `POST /api/upload` — multipart file upload, validates extension (pdf/docx) and size (50MB max), saves to `./uploads/<user_id>/<uuid>.<ext>`, triggers background ingestion
- `GET /api/upload/documents` — paginated list with optional status filter
- `GET /api/upload/documents/{id}` — single document by ID (scoped to user)
- `DELETE /api/upload/documents/{id}` — deletes file from disk and DB record
- `_run_ingestion_background()` — creates its own DB session for background task isolation
- Uses `BackgroundTasks` to trigger ingestion without blocking the upload response

### Dependencies
`models/document.py`, `core/security.py`, `pipelines/ingestion_pipeline.py`.

### Why It Matters
Upload is the entry point for all document processing. Background ingestion keeps the API responsive.

---

## backend/api/query.py

### Purpose
Route handlers for RAG queries and history.

### Key Concepts
- `POST /api/query` — accepts question + optional document_ids, returns answer with source chunks and document IDs
- `GET /api/query/history` — paginated query history for current user
- QueryResponse includes parsed JSON fields (source_chunks, document_ids as lists)
- History endpoint manually constructs response objects to parse JSON fields

### Dependencies
`pipelines/query_pipeline.py`, `models/query.py`, `core/security.py`.

### Why It Matters
User-facing RAG endpoint. The core feature of the application.

---

## backend/main.py

### Purpose
FastAPI application entry point. Wires everything together.

### Flow
Import models (register tables) → create app → add CORS middleware → register routers → startup event creates tables.

### Key Concepts
- Model imports with `# noqa: F401` ensure SQLAlchemy registers all tables before `create_all()`
- `@app.on_event("startup")` calls `Base.metadata.create_all()` — creates tables if they don't exist
- CORS configured for `http://localhost:3000` (frontend dev server)
- Routers: auth (`/api/auth`), upload (`/api/upload`), query (`/api/query`)
- Health check at `GET /` returns `{"status": "ok"}`

### Dependencies
All api/ routers, all models/, core/config, core/database.

### Why It Matters
Single entry point. `uvicorn main:app --reload` starts the entire backend.
