import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, ActionableRecommendation
from app.core.logging import logger

class RecommendationService:
    async def analyze_recommendations(self, request: RecommendationRequest) -> RecommendationResponse:
        logger.info("Analyzing study performance and generating recommendations")
        exam_str = json.dumps(request.exam_results) if request.exam_results else "No exam history recorded yet."
        topics_str = ", ".join(request.study_topics) if request.study_topics else "General Coursework"

        prompt = get_prompt("recommendation", exam_results=exam_str, study_topics=topics_str)
        raw_response = await llm_service.generate_completion(prompt)

        try:
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                recs = [
                    ActionableRecommendation(
                        topic=r.get("topic", "General Study"),
                        action=r.get("action", "Practice more questions."),
                        priority=r.get("priority", "Medium")
                    )
                    for r in parsed.get("recommendations", [])
                ]
                return RecommendationResponse(
                    weakTopics=parsed.get("weakTopics", []),
                    recommendations=recs,
                    overallAdvice=parsed.get("overallAdvice", "Focus on practicing weak areas consistently.")
                )
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response for recommendations: {str(e)}")

        return RecommendationResponse(
            weakTopics=["Core Foundations"],
            recommendations=[
                ActionableRecommendation(topic="Overall Review", action="Generate a practice quiz to test your memory.", priority="High")
            ],
            overallAdvice="Consistently review your uploaded notes and test yourself using flashcards."
        )

recommendation_service = RecommendationService()
