from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, description="User question for RAG")
    note_id: Optional[str] = Field(None, description="Optional note ID filter")
    top_k: int = Field(4, ge=1, le=10, description="Number of context chunks to retrieve")

class SourceChunk(BaseModel):
    text: str
    metadata: Dict[str, Any]
    score: float

class RagQueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
