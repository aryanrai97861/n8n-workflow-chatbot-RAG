import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any
import uuid
from config import settings


class VectorStoreService:
    """Service for managing ChromaDB vector storage"""
    
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    
    def create_collection(self, name: str) -> Any:
        """Create or get a collection"""
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_documents(
        self, 
        collection_name: str, 
        texts: List[str], 
        embeddings: List[List[float]],
        metadatas: List[Dict] = None
    ) -> List[str]:
        """Add documents with embeddings to a collection"""
        collection = self.create_collection(collection_name)
        
        # Generate unique IDs for each document
        ids = [str(uuid.uuid4()) for _ in texts]
        
        if metadatas is None:
            metadatas = [{"chunk_index": i} for i in range(len(texts))]
        
        collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        return ids
    
    def query(
        self, 
        collection_name: str, 
        query_embedding: List[float], 
        n_results: int = 5
    ) -> Dict[str, Any]:
        """Query the collection for similar documents"""
        try:
            collection = self.client.get_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            return results
        except Exception as e:
            raise Exception(f"Error querying collection: {str(e)}")
    
    def delete_collection(self, name: str):
        """Delete a collection"""
        try:
            self.client.delete_collection(name)
        except Exception:
            pass  # Collection might not exist
    
    def list_collections(self) -> List[str]:
        """List all collections"""
        collections = self.client.list_collections()
        return [c.name for c in collections]
