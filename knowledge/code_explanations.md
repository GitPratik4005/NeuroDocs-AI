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
