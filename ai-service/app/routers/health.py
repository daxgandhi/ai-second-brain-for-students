import time
import httpx
from fastapi import APIRouter
from app.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health_status():
    checks = {
        "api": "ok",
        "gemini": "unknown",
        "chromadb": "unknown",
        "ollama": "unknown"
    }

    # Check Gemini Configuration
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        checks["gemini"] = "configured"
    else:
        checks["gemini"] = "missing_key"

    # Check ChromaDB HTTP connection
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.CHROMADB_URL.rstrip('/')}/api/v1/heartbeat")
            if res.status_code == 200:
                checks["chromadb"] = "online"
            else:
                checks["chromadb"] = f"status_{res.status_code}"
    except Exception:
        checks["chromadb"] = "unreachable"

    # Check Ollama connection
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags")
            if res.status_code == 200:
                checks["ollama"] = "online"
            else:
                checks["ollama"] = f"status_{res.status_code}"
    except Exception:
        checks["ollama"] = "unreachable"

    all_ok = checks["api"] == "ok" and checks["gemini"] == "configured"
    overall_status = "healthy" if all_ok else "degraded"

    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
        "active_provider": settings.LLM_PROVIDER,
        "dependencies": checks
    }
