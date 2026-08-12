from pydantic import BaseModel, Field
from typing import List, Optional

class ExamQuestion(BaseModel):
    question: str
    options: List[str]
    correctAnswer: int
    explanation: Optional[str] = None

class ExamGenerateRequest(BaseModel):
    topic: str = Field(..., description="Exam subject or topic")
    question_count: int = Field(5, ge=1, le=20, description="Number of questions")
    difficulty: str = Field("medium", description="Difficulty: easy | medium | hard")
    content: Optional[str] = Field(None, description="Optional note text context")

class ExamGenerateResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[ExamQuestion]
