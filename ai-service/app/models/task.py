import time
import uuid
from typing import Dict, Any, Optional

class AsyncTaskTracker:
    """
    In-memory async task tracker for background operations.
    Can be seamlessly upgraded to Redis/Celery.
    """
    def __init__(self):
        self._tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self, task_type: str) -> str:
        task_id = str(uuid.uuid4())
        self._tasks[task_id] = {
            "task_id": task_id,
            "task_type": task_type,
            "status": "processing",  # processing | completed | failed
            "result": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time()
        }
        return task_id

    def update_status(self, task_id: str, status: str, result: Optional[Any] = None, error: Optional[str] = None):
        if task_id in self._tasks:
            self._tasks[task_id]["status"] = status
            self._tasks[task_id]["updated_at"] = time.time()
            if result is not None:
                self._tasks[task_id]["result"] = result
            if error is not None:
                self._tasks[task_id]["error"] = error

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self._tasks.get(task_id)

task_tracker = AsyncTaskTracker()
