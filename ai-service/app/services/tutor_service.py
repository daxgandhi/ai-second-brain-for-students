import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.tutor import (
    CurriculumRequest, CurriculumResponse,
    LessonRequest, LessonResponse,
    QuestionRequest, QuestionResponse,
    EvaluationRequest, EvaluationResponse
)
from app.core.logging import logger

class TutorService:
    async def _parse_json(self, raw_response: str) -> dict:
        json_match = re.search(r'\{.*\}|\[.*\]', raw_response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        raise ValueError("Failed to extract valid JSON from LLM response")

    async def generate_curriculum(self, request: CurriculumRequest) -> CurriculumResponse:
        logger.info(f"Generating tutor curriculum")
        
        kg_str = ""
        if request.kg_nodes and request.kg_edges:
            nodes = [n.get('label') for n in request.kg_nodes]
            edges = [f"{e.get('from')} -> {e.get('label')} -> {e.get('to')}" for e in request.kg_edges]
            kg_str = f"Concepts: {', '.join(nodes)}\nRelationships:\n" + "\n".join(edges)
        else:
            kg_str = "No existing Knowledge Graph available. Generate directly from note."

        prompt = get_prompt("tutor_curriculum", note_content=request.note_content, kg_data=kg_str)
        raw_response = await llm_service.generate_completion(prompt)

        try:
            parsed = await self._parse_json(raw_response)
            # Handle both {"curriculum": [...]} and [...] array formats
            if isinstance(parsed, list):
                curriculum = parsed
            else:
                curriculum = parsed.get("curriculum", [])
            
            if not curriculum:
                raise ValueError("Empty curriculum")

            return CurriculumResponse(curriculum=curriculum)
        except Exception as e:
            logger.warning(f"Failed to parse LLM curriculum response: {str(e)}")
            # Fallback ordering
            return CurriculumResponse(curriculum=["Introduction", "Core Concepts", "Advanced Details"])

    async def generate_lesson(self, request: LessonRequest) -> LessonResponse:
        logger.info(f"Generating lesson for concept: {request.concept}")
        
        prompt = get_prompt("tutor_lesson", concept=request.concept, note_content=request.note_content)
        raw_response = await llm_service.generate_completion(prompt)

        try:
            parsed = await self._parse_json(raw_response)
            return LessonResponse(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse lesson response: {str(e)}")
            return LessonResponse(
                concept=request.concept,
                definition="A topic from your notes.",
                simple_explanation="We couldn't generate a detailed explanation at this moment.",
                how_it_works="Please review your original notes for this concept.",
                real_world_example="No example available.",
                key_points=["Review your notes directly."],
                source_context="Relevant source context is unavailable for this concept."
            )

    async def generate_question(self, request: QuestionRequest) -> QuestionResponse:
        logger.info(f"Generating question for concept: {request.concept}")
        
        prompt = get_prompt("tutor_question", concept=request.concept, lesson_context=request.lesson_context, attempt_number=request.attempt_number)
        raw_response = await llm_service.generate_completion(prompt)

        try:
            parsed = await self._parse_json(raw_response)
            return QuestionResponse(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse question response: {str(e)}")
            return QuestionResponse(
                question=f"Do you understand the concept of {request.concept}?",
                type="mcq",
                options=["Yes", "No", "Maybe", "Not sure"],
                correct_answer="Yes",
                explanation="This is a fallback question."
            )

    async def evaluate_answer(self, request: EvaluationRequest) -> EvaluationResponse:
        logger.info(f"Evaluating answer for concept: {request.concept}")
        
        prompt = get_prompt(
            "tutor_evaluation", 
            concept=request.concept, 
            question=request.question,
            correct_answer=request.correct_answer,
            user_answer=request.user_answer
        )
        raw_response = await llm_service.generate_completion(prompt)

        try:
            parsed = await self._parse_json(raw_response)
            return EvaluationResponse(**parsed)
        except Exception as e:
            logger.warning(f"Failed to parse evaluation response: {str(e)}")
            
            is_correct = str(request.user_answer).lower().strip() == str(request.correct_answer).lower().strip()
            return EvaluationResponse(
                correct=is_correct,
                score=100 if is_correct else 0,
                feedback="Correct!" if is_correct else "Incorrect.",
                explanation=f"The correct answer was {request.correct_answer}.",
                next_action="continue" if is_correct else "retry",
                reteach_explanation="Try reviewing the lesson again." if not is_correct else None,
                new_example="Check your original notes." if not is_correct else None
            )

tutor_service = TutorService()
