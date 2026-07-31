from fastapi import APIRouter
from app.schemas.rag import RagQueryRequest, RagQueryResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/ai/rag", tags=["RAG Engine"])

@router.post("/chat", response_model=RagQueryResponse)
async def chat_with_notes(request: RagQueryRequest):
    return await rag_service.answer_rag_query(request)

@router.delete("/notes/{note_id}")
async def delete_note_vectors(note_id: str):
    count = rag_service.delete_note_vectors(note_id)
    return {"status": "success", "note_id": note_id, "deleted_chunks": count}
