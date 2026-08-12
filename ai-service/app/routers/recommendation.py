from fastapi import APIRouter
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/ai/recommendation", tags=["Study Recommendations"])

@router.post("/generate", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    return await recommendation_service.analyze_recommendations(request)
