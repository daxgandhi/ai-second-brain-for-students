from fastapi import APIRouter
from app.schemas.flashcard import (
    FlashcardGenerateRequest, FlashcardGenerateResponse,
    SrsRatingRequest, SrsRatingResponse
)
from app.services.flashcard_service import flashcard_service

router = APIRouter(prefix="/api/ai/flashcards", tags=["Flashcards & SRS"])

@router.post("/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(request: FlashcardGenerateRequest):
    return await flashcard_service.generate_flashcards(request)

@router.post("/srs-rate", response_model=SrsRatingResponse)
async def calculate_srs_rating(request: SrsRatingRequest):
    return flashcard_service.calculate_srs(request)
