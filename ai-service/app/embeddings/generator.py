from typing import List
from app.core.logging import logger
from app.core.exceptions import AIServiceException

class EmbeddingGenerator:
    def __init__(self):
        self.model = None

    def _load_model(self):
        if self.model is None:
            try:
                logger.info("Loading SentenceTransformer model: all-MiniLM-L6-v2...")
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("SentenceTransformer model successfully loaded.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer: {str(e)}")
                raise AIServiceException(f"Embedding model initialization failed: {str(e)}")

    def generate_embedding(self, text: str) -> List[float]:
        self._load_model()
        try:
            embedding = self.model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise AIServiceException(f"Embedding generation error: {str(e)}")

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        self._load_model()
        try:
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {str(e)}")
            raise AIServiceException(f"Batch embedding generation error: {str(e)}")

embedding_generator = EmbeddingGenerator()
