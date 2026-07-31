from pydantic import BaseModel, Field
from typing import Optional

class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Text content to summarize")
    title: Optional[str] = Field("Study Note", description="Title or topic of the source content")

class SummaryResponse(BaseModel):
    summary: str
    original_word_count: int
    summary_word_count: int
    compression_ratio: int
