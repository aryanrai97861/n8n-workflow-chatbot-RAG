from sentence_transformers import SentenceTransformer
from typing import List


class LocalEmbeddingService:
    """Service for generating embeddings using local sentence-transformers model"""
    
    _model = None  # Singleton model to avoid reloading
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize with a local model.
        Default model: all-MiniLM-L6-v2 (384 dimensions, fast and good quality)
        """
        self.model_name = model_name
        if LocalEmbeddingService._model is None:
            print(f"Loading local embedding model: {model_name}")
            LocalEmbeddingService._model = SentenceTransformer(model_name)
        self.model = LocalEmbeddingService._model
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts (batched for efficiency)"""
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a query (same as document embedding for this model)"""
        return self.generate_embedding(query)
