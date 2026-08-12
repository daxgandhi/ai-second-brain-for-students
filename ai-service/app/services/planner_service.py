import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.planner import PlannerGenerateRequest, PlannerGenerateResponse, DailyScheduleItem
from app.core.logging import logger

class PlannerService:
    async def generate_plan(self, request: PlannerGenerateRequest) -> PlannerGenerateResponse:
        logger.info(f"Generating study plan for subject: {request.subject}")
        prompt = get_prompt(
            "planner",
            subject=request.subject,
            timeframe=request.timeframe,
            hours_per_day=request.hours_per_day
        )
        raw_response = await llm_service.generate_completion(prompt)

        try:
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                schedule_items = [
                    DailyScheduleItem(
                        day=item.get("day", i+1),
                        focus=item.get("focus", f"Day {i+1} Core Concepts"),
                        tasks=item.get("tasks", ["Read notes", "Practice flashcards"]),
                        estimatedHours=float(item.get("estimatedHours", request.hours_per_day))
                    )
                    for i, item in enumerate(parsed.get("dailySchedule", []))
                ]
                return PlannerGenerateResponse(
                    planTitle=parsed.get("planTitle", f"Study Plan for {request.subject}"),
                    totalDays=parsed.get("totalDays", len(schedule_items)),
                    dailySchedule=schedule_items,
                    tips=parsed.get("tips", ["Stay consistent", "Take 10 min breaks"])
                )
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON response for planner: {str(e)}")

        # Fallback plan
        return PlannerGenerateResponse(
            planTitle=f"Study Plan for {request.subject}",
            totalDays=7,
            dailySchedule=[
                DailyScheduleItem(day=1, focus=f"Fundamentals of {request.subject}", tasks=["Review core notes", "Summarize chapters"], estimatedHours=request.hours_per_day),
                DailyScheduleItem(day=2, focus=f"Deep Dive {request.subject}", tasks=["Practice exam questions", "Generate flashcards"], estimatedHours=request.hours_per_day)
            ],
            tips=["Study in 25-minute Pomodoro blocks", "Review weak topics daily"]
        )

planner_service = PlannerService()
