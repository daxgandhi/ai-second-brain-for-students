from fastapi import APIRouter
from app.schemas.exam import ExamGenerateRequest, ExamGenerateResponse
from app.services.exam_service import exam_service

router = APIRouter(prefix="/api/ai/exam", tags=["Quiz & Exam Generator"])

@router.post("/generate", response_model=ExamGenerateResponse)
async def generate_exam_paper(request: ExamGenerateRequest):
    return await exam_service.generate_exam(request)
