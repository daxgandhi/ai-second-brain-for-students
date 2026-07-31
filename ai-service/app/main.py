from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.logging import logger
from app.core.exceptions import AIServiceException, ai_service_exception_handler, global_exception_handler
from app.routers import health, summary, tasks, document, rag

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Dedicated AI, NLP, ML & RAG Microservice for AI Second Brain"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(AIServiceException, ai_service_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Register Routers
app.include_router(health.router)
app.include_router(summary.router)
app.include_router(tasks.router)
app.include_router(document.router)
app.include_router(rag.router)

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} starting on http://{settings.HOST}:{settings.PORT}")
    logger.info(f"🤖 Active LLM Provider: {settings.LLM_PROVIDER}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"🛑 Shutting down {settings.PROJECT_NAME}")
