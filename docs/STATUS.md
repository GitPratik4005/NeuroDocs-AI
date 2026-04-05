# Project Status

---

## Current Phase
MVP

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
- **Ingestion pipeline** — chunking (500 chars, 50 overlap) → Ollama embedding → ChromaDB storage
- **RAG query pipeline** — semantic retrieval → Ollama LLM answer generation → query history

---

## In Progress
- Frontend MVP (Next.js + shadcn/ui) — blocked on Node.js installation

---

## Next (MVP Scope)
1. ~~Backend skeleton~~ ✓
2. ~~Auth system~~ ✓
3. ~~Upload API~~ ✓
4. ~~Text extraction~~ ✓
5. ~~Ingestion pipeline~~ ✓
6. ~~RAG query pipeline~~ ✓
7. Frontend MVP (login, dashboard, upload, chat)
8. MVP polish (tests, error handling, docs)