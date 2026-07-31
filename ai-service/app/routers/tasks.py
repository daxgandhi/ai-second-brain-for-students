from fastapi import APIRouter, HTTPException
from app.models.task import task_tracker

router = APIRouter(prefix="/api/ai/tasks", tags=["Background Tasks"])

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    task = task_tracker.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
