import chromadb
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from app.config import settings
from app.core.logging import logger
from app.core.exceptions import VectorStoreException

class ChromaDBClient:
    def __init__(self):
        self.client = None
        self.collection = None

    def _get_client(self):
        if self.client is None:
            try:
                url_obj = urlparse(settings.CHROMADB_URL)
                host = url_obj.hostname or "localhost"
                port = url_obj.port or (443 if url_obj.scheme == "https" else 8000)
                
                logger.info(f"Connecting to ChromaDB at {host}:{port}...")
                self.client = chromadb.HttpClient(host=host, port=port)
                self.collection = self.client.get_or_create_collection(
                    name=settings.CHROMADB_COLLECTION,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"ChromaDB connected. Collection: {settings.CHROMADB_COLLECTION}")
            except Exception as e:
                logger.error(f"ChromaDB connection error: {str(e)}")
                raise VectorStoreException(f"Failed to connect to ChromaDB: {str(e)}")

    def upsert_vectors(self, ids: List[str], embeddings: List[List[float]], documents: List[str], metadatas: List[Dict[str, Any]]):
        self._get_client()
        try:
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Successfully upserted {len(ids)} vectors into ChromaDB")
        except Exception as e:
            logger.error(f"ChromaDB upsert error: {str(e)}")
            raise VectorStoreException(f"ChromaDB upsert failed: {str(e)}")

    def query_vectors(self, query_embedding: List[float], top_k: int = 4, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        self._get_client()
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter
            )

            matched_results = []
            if results and results.get("documents") and len(results["documents"]) > 0 and len(results["documents"][0]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

                for i in range(len(docs)):
                    dist = distances[i]
                    score = max(0.0, 1.0 - dist)
                    matched_results.append({
                        "text": docs[i],
                        "metadata": metas[i],
                        "distance": dist,
                        "score": score
                    })

            return matched_results
        except Exception as e:
            logger.error(f"ChromaDB query error: {str(e)}")
            raise VectorStoreException(f"ChromaDB query failed: {str(e)}")

    def delete_by_note_id(self, note_id: str) -> int:
        self._get_client()
        try:
            results = self.collection.get(where={"noteId": str(note_id)})
            if results and results.get("ids") and len(results["ids"]) > 0:
                ids_to_delete = results["ids"]
                self.collection.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} vectors for note_id: {note_id}")
                return len(ids_to_delete)
            return 0
        except Exception as e:
            logger.error(f"ChromaDB delete error: {str(e)}")
            raise VectorStoreException(f"ChromaDB delete failed: {str(e)}")

chroma_client = ChromaDBClient()
