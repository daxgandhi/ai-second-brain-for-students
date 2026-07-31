from typing import List, Optional
from app.services.ocr_service import ocr_service
from app.services.embedding_service import embedding_service
from app.chromadb.client import chroma_client
from app.rag.chunker import text_chunker
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.rag import RagQueryRequest, RagQueryResponse, SourceChunk
from app.core.logging import logger

class RagService:
    async def process_and_ingest_document(self, note_id: str, title: str, text_content: Optional[str] = None, file_path: Optional[str] = None) -> int:
        logger.info(f"RAG Ingestion starting for note: {title} ({note_id})")

        content = text_content or ""
        if file_path and not content:
            content = ocr_service.process_pdf(file_path)

        if not content:
            logger.warning(f"No text content found to ingest for note: {title}")
            return 0

        chunks = text_chunker.chunk_text(content, size=1000, overlap=100)
        logger.info(f"Generated {len(chunks)} chunks for note: {title}")

        ids = [f"{note_id}_chunk_{i}" for i in range(len(chunks))]
        embeddings = embedding_service.get_embeddings_batch(chunks)
        metadatas = [
            {
                "noteId": str(note_id),
                "title": title,
                "chunkIndex": i,
                "source": "pdf" if file_path else "text"
            }
            for i in range(len(chunks))
        ]

        chroma_client.upsert_vectors(ids, embeddings, chunks, metadatas)
        return len(chunks)

    async def answer_rag_query(self, request: RagQueryRequest) -> RagQueryResponse:
        logger.info(f"Answering RAG query: '{request.question}'")

        query_embedding = embedding_service.get_embedding(request.question)

        where_filter = None
        if request.note_id and request.note_id != "all":
            where_filter = {"noteId": str(request.note_id)}

        matched_results = chroma_client.query_vectors(query_embedding, top_k=request.top_k, where_filter=where_filter)

        sources = [
            SourceChunk(
                text=r["text"],
                metadata=r["metadata"],
                score=r["score"]
            )
            for r in matched_results
        ]

        if not matched_results:
            context_str = "No relevant context found in uploaded notes."
        else:
            context_str = "\n\n---\n\n".join([f"Snippet {i+1}:\n{r['text']}" for i, r in enumerate(matched_results)])

        prompt = get_prompt("rag", context=context_str, question=request.question)
        answer = await llm_service.generate_completion(prompt)

        return RagQueryResponse(
            answer=answer,
            sources=sources
        )

    def delete_note_vectors(self, note_id: str) -> int:
        return chroma_client.delete_by_note_id(note_id)

rag_service = RagService()
