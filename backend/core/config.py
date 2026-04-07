from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "NeuroDocAI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str

    # PostgreSQL
    DATABASE_URL: str

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8100

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    OLLAMA_LLM_MODEL: str = "llama3"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./uploads"

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
