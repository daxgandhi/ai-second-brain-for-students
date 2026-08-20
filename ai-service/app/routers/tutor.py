from fastapi import APIRouter, HTTPException
from app.schemas.tutor import (
    CurriculumRequest, CurriculumResponse,
    LessonRequest, LessonResponse,
    QuestionRequest, QuestionResponse,
    EvaluationRequest, EvaluationResponse
)
from app.services.tutor_service import tutor_service
from app.core.logging import logger

router = APIRouter(prefix="/api/ai/tutor", tags=["Cortex Tutor"])

@router.post("/curriculum", response_model=CurriculumResponse)
async def generate_curriculum(request: CurriculumRequest):
    try:
        return await tutor_service.generate_curriculum(request)
    except Exception as e:
        logger.error(f"Error generating curriculum: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate curriculum")

@router.post("/lesson", response_model=LessonResponse)
async def generate_lesson(request: LessonRequest):
    try:
        return await tutor_service.generate_lesson(request)
    except Exception as e:
        logger.error(f"Error generating lesson: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate lesson")

@router.post("/question", response_model=QuestionResponse)
async def generate_question(request: QuestionRequest):
    try:
        return await tutor_service.generate_question(request)
    except Exception as e:
        logger.error(f"Error generating question: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate question")

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(request: EvaluationRequest):
    try:
        return await tutor_service.evaluate_answer(request)
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answer")
