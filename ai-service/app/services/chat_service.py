from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.chat import ChatRequest, ChatResponse

class ChatService:
    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        prompt = get_prompt("chat", message=request.message)
        reply = await llm_service.generate_completion(prompt)
        return ChatResponse(reply=reply)

chat_service = ChatService()
