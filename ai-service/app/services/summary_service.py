from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.core.logging import logger

class SummaryService:
    async def summarize_text(self, request: SummaryRequest) -> SummaryResponse:
        logger.info(f"Summarizing text for topic: {request.title}")
        prompt = get_prompt("summary", text=request.text)
        
        summary_text = await llm_service.generate_completion(prompt)
        
        original_words = len(request.text.strip().split())
        summary_words = len(summary_text.strip().split())
        if original_words == 0:
            original_words = 1
            
        ratio = max(0, min(100, int((1 - summary_words / original_words) * 100)))
        
        return SummaryResponse(
            summary=summary_text,
            original_word_count=original_words,
            summary_word_count=summary_words,
            compression_ratio=ratio
        )

summary_service = SummaryService()
