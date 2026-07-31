import asyncio
from fastapi import APIRouter, BackgroundTasks
from app.schemas.document import DocumentProcessRequest, DocumentProcessResponse
from app.services.rag_service import rag_service
from app.models.task import task_tracker
from app.core.logging import logger

router = APIRouter(prefix="/api/ai/document", tags=["Document Processing"])

def _async_ingest_task(task_id: str, note_id: str, title: str, text_content: str = None, file_path: str = None):
    try:
        logger.info(f"[Task {task_id}] Starting async ingestion for document {title}")
        chunks_count = asyncio.run(rag_service.process_and_ingest_document(note_id, title, text_content, file_path))
        task_tracker.update_status(task_id, "completed", result={"chunks_ingested": chunks_count})
        logger.info(f"[Task {task_id}] Completed async ingestion for document {title}")
    except Exception as e:
        logger.error(f"[Task {task_id}] Ingestion task failed: {str(e)}")
        task_tracker.update_status(task_id, "failed", error=str(e))

@router.post("/process", response_model=DocumentProcessResponse)
async def process_document(request: DocumentProcessRequest, background_tasks: BackgroundTasks):
    task_id = task_tracker.create_task("document_ingestion")
    
    background_tasks.add_task(
        _async_ingest_task,
        task_id,
        request.note_id,
        request.title,
        request.text_content,
        request.file_path
    )

    return DocumentProcessResponse(
        task_id=task_id,
        status="processing",
        message="Document processing queued in background."
    )
