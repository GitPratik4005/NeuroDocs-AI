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

---

## In Progress
- MVP development (not started)

---

## Next (MVP Scope)
1. Backend skeleton (main.py, core/config, core/database, core/security)
2. Auth system (JWT register/login/me)
3. Upload API (PDF/DOCX upload, document management)
4. Basic text extraction
5. Ingestion pipeline (chunking + embedding)
6. RAG query pipeline (semantic search + Q&A)
7. Simple chat frontend