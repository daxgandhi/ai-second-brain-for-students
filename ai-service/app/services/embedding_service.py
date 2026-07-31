from typing import List
from app.embeddings.generator import embedding_generator

class EmbeddingService:
    def get_embedding(self, text: str) -> List[float]:
        return embedding_generator.generate_embedding(text)

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        return embedding_generator.generate_embeddings_batch(texts)

embedding_service = EmbeddingService()
