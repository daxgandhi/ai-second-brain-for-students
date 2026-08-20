from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ActionableRecommendation(BaseModel):
    type: str  # explanation, practice, flashcards
    title: str
    duration: int

class RecommendationRequest(BaseModel):
    exam_results: List[Dict[str, Any]]
    study_topics: List[str]
    kg_context: List[str] = [] # Added for knowledge graph edge context

class RecommendationResponse(BaseModel):
    focus_topic: str
    performance: int
    weak_concepts: List[str]
    reason: str
    related_concepts: List[str]
    plan: List[ActionableRecommendation]
