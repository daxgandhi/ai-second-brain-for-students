from fastapi import APIRouter
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.summary_service import summary_service

router = APIRouter(prefix="/api/ai/summary", tags=["Summarizer"])

@router.post("", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    return await summary_service.summarize_text(request)
