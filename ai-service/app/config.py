import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Second Brain Microservice"
    VERSION: str = "1.0.0"
    ENV: str = "development"
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # Legacy, kept for backward compatibility
    AI_PROVIDER: str = "auto"     # auto | gemini | groq | ollama
    AI_PROVIDER_ORDER: str = "gemini,groq"

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # Vector Store Settings
    CHROMADB_URL: str = "http://localhost:8000"
    CHROMADB_COLLECTION: str = "notes_collection"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
