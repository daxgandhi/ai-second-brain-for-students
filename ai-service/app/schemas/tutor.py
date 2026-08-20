from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CurriculumRequest(BaseModel):
    note_content: str
    kg_nodes: List[Dict[str, Any]]
    kg_edges: List[Dict[str, Any]]

class CurriculumResponse(BaseModel):
    curriculum: List[str]

class LessonRequest(BaseModel):
    concept: str
    note_content: str

class LessonResponse(BaseModel):
    concept: str
    definition: str
    simple_explanation: str
    how_it_works: str
    real_world_example: str
    key_points: List[str]
    source_context: str

class QuestionRequest(BaseModel):
    concept: str
    lesson_context: str
    attempt_number: int = 1

class QuestionResponse(BaseModel):
    question: str
    type: str = "mcq"
    options: List[str]
    correct_answer: str
    explanation: str

class EvaluationRequest(BaseModel):
    concept: str
    question: str
    user_answer: str
    correct_answer: str

class EvaluationResponse(BaseModel):
    correct: bool
    score: int
    feedback: str
    explanation: str
    next_action: str  # continue, retry, review
    reteach_explanation: Optional[str] = None
    new_example: Optional[str] = None
