from fastapi import APIRouter
from app.schemas.planner import PlannerGenerateRequest, PlannerGenerateResponse
from app.services.planner_service import planner_service

router = APIRouter(prefix="/api/ai/planner", tags=["Study Schedule Planner"])

@router.post("/generate", response_model=PlannerGenerateResponse)
async def generate_study_plan(request: PlannerGenerateRequest):
    return await planner_service.generate_plan(request)
