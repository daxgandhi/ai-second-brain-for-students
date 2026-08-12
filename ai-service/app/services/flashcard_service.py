import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.flashcard import (
    FlashcardGenerateRequest, FlashcardGenerateResponse, FlashcardItem,
    SrsRatingRequest, SrsRatingResponse
)
from app.core.logging import logger
from app.core.exceptions import AIServiceException

class FlashcardService:
    async def generate_flashcards(self, request: FlashcardGenerateRequest) -> FlashcardGenerateResponse:
        logger.info(f"Generating {request.count} flashcards for topic: {request.topic}")
        prompt = get_prompt("flashcards", count=request.count, content=request.topic)
        raw_response = await llm_service.generate_completion(prompt)

        cards = []
        try:
            # Extract JSON block
            json_match = re.search(r'\[.*\]', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                for item in parsed:
                    cards.append(FlashcardItem(front=item.get("front", ""), back=item.get("back", "")))
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response for flashcards: {str(e)}")

        if not cards:
            # Fallback default card
            cards = [
                FlashcardItem(front=f"Overview of {request.topic}", back="Key concept review details extracted from notes.")
            ]

        return FlashcardGenerateResponse(
            title=f"{request.topic} Deck",
            cards=cards
        )

    def calculate_srs(self, request: SrsRatingRequest) -> SrsRatingResponse:
        """
        SuperMemo-2 (SM-2) Spaced Repetition Algorithm implementation
        """
        rating_scores = {"easy": 5, "good": 3, "hard": 1}
        q = rating_scores.get(request.rating.lower(), 3)

        # Update Ease Factor
        ef = request.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        ef = max(1.3, ef)

        if q < 3:
            repetition = 0
            interval = 1
        else:
            repetition = request.repetition + 1
            if repetition == 1:
                interval = 1
            elif repetition == 2:
                interval = 6
            else:
                interval = int(request.interval * ef)

        return SrsRatingResponse(
            next_review_days=interval,
            new_interval=interval,
            new_repetition=repetition,
            new_ease_factor=round(ef, 2)
        )

flashcard_service = FlashcardService()
