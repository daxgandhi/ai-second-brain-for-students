from pydantic import BaseModel, Field
from typing import List, Optional

class DailyScheduleItem(BaseModel):
    day: int
    focus: str
    tasks: List[str]
    estimatedHours: float

class PlannerGenerateRequest(BaseModel):
    subject: str = Field(..., description="Subject or exam goal")
    timeframe: str = Field("7 days", description="Study period or target date")
    hours_per_day: float = Field(2.0, ge=0.5, le=12.0, description="Daily available study hours")

class PlannerGenerateResponse(BaseModel):
    planTitle: str
    totalDays: int
    dailySchedule: List[DailyScheduleItem]
    tips: List[str]
