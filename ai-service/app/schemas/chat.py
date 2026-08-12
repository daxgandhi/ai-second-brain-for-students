from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query or message")

class ChatResponse(BaseModel):
    reply: str
