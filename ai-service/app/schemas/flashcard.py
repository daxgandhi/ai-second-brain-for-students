from pydantic import BaseModel, Field
from typing import List, Optional

class FlashcardItem(BaseModel):
    front: str
    back: str

class FlashcardGenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic or content for flashcards")
    count: int = Field(5, ge=1, le=20, description="Number of flashcards")

class FlashcardGenerateResponse(BaseModel):
    title: str
    cards: List[FlashcardItem]

class SrsRatingRequest(BaseModel):
    rating: str = Field(..., description="Rating: easy | good | hard")
    interval: int = Field(1, description="Current review interval in days")
    repetition: int = Field(0, description="Repetition count")
    ease_factor: float = Field(2.5, description="SuperMemo ease factor")

class SrsRatingResponse(BaseModel):
    next_review_days: int
    new_interval: int
    new_repetition: int
    new_ease_factor: float
