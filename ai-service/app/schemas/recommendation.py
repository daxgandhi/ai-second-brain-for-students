from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ActionableRecommendation(BaseModel):
    topic: str
    action: str
    priority: str

class RecommendationRequest(BaseModel):
    exam_results: List[Dict[str, Any]] = Field(default_factory=list, description="Past quiz/exam scores")
    study_topics: List[str] = Field(default_factory=list, description="List of studied topics")

class RecommendationResponse(BaseModel):
    weakTopics: List[str]
    recommendations: List[ActionableRecommendation]
    overallAdvice: str
