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
        kg_str = ", ".join(request.kg_context) if request.kg_context else "No graph context available."

        prompt = get_prompt("recommendation", exam_results=exam_str, study_topics=topics_str, kg_context=kg_str)
        raw_response = await llm_service.generate_completion(prompt)

        try:
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                recs = [
                    ActionableRecommendation(
                        type=r.get("type", "practice"),
                        title=r.get("title", "Review topic"),
                        duration=r.get("duration", 5)
                    )
                    for r in parsed.get("plan", [])
                ]
                return RecommendationResponse(
                    focus_topic=parsed.get("focus_topic", "General Study"),
                    performance=parsed.get("performance", 0),
                    weak_concepts=parsed.get("weak_concepts", []),
                    reason=parsed.get("reason", "Based on your study data."),
                    related_concepts=parsed.get("related_concepts", []),
                    plan=recs
                )
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response for recommendations: {str(e)}")

        return RecommendationResponse(
            focus_topic="Core Foundations",
            performance=0,
            weak_concepts=["Core Foundations"],
            reason="Insufficient data to generate specific insights.",
            related_concepts=[],
            plan=[
                ActionableRecommendation(type="practice", title="Generate a practice quiz to test your memory.", duration=10)
            ]
        )

recommendation_service = RecommendationService()
