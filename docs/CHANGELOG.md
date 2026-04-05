# Changelog

All notable changes to this project are documented here.

Format:
- Latest entries appear at the top
- Each entry includes a timestamp
---

## [Unreleased]

### Added
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

### Changed
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