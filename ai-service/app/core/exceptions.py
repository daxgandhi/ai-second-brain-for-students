from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger

class AIServiceException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class LLMProviderException(AIServiceException):
    def __init__(self, message: str):
        super().__init__(f"LLM Provider Error: {message}", status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

class VectorStoreException(AIServiceException):
    def __init__(self, message: str):
        super().__init__(f"Vector Store Error: {message}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    logger.error(f"Error processing {request.method} {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.message}
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "message": "An unexpected error occurred in AI service."}
    )
