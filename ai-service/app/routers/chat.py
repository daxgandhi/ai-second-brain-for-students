from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/api/ai/chat", tags=["Conversational Chat"])

@router.post("", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    return await chat_service.process_chat(request)
