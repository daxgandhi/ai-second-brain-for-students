import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.exam import ExamGenerateRequest, ExamGenerateResponse, ExamQuestion
from app.core.logging import logger

class ExamService:
    async def generate_exam(self, request: ExamGenerateRequest) -> ExamGenerateResponse:
        logger.info(f"Generating {request.question_count} exam questions on {request.topic} ({request.difficulty})")
        context_str = request.content or "Standard subject concepts"
        prompt = get_prompt(
            "exam",
            question_count=request.question_count,
            topic=request.topic,
            difficulty=request.difficulty,
            content=context_str
        )
        raw_response = await llm_service.generate_completion(prompt)

        questions = []
        try:
            json_match = re.search(r'\[.*\]', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                for q in parsed:
                    questions.append(ExamQuestion(
                        question=q.get("question", "Sample Question"),
                        options=q.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                        correctAnswer=int(q.get("correctAnswer", 0)),
                        explanation=q.get("explanation", "")
                    ))
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response for exam questions: {str(e)}")

        if not questions:
            questions = [
                ExamQuestion(
                    question=f"What is a primary concept of {request.topic}?",
                    options=["Core Principle A", "Option B", "Option C", "Option D"],
                    correctAnswer=0,
                    explanation="Fundamental concept derived from course notes."
                )
            ]

        return ExamGenerateResponse(
            topic=request.topic,
            difficulty=request.difficulty,
            questions=questions
        )

exam_service = ExamService()
