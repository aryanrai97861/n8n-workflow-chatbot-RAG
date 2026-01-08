from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import time

from database import get_db
from models.document import Document
from services.text_extractor import TextExtractor
from services.local_embedding import LocalEmbeddingService
from services.vector_store import VectorStoreService
from config import settings

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


def safe_remove_file(file_path: str, retries: int = 3):
    """Safely remove a file with retry logic for Windows"""
    for i in range(retries):
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            return
        except PermissionError:
            if i < retries - 1:
                time.sleep(0.5)  # Wait before retry
            else:
                pass  # Give up silently


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    api_key: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    # Validate file type
    allowed_extensions = ['.pdf', '.txt', '.md']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {allowed_extensions}"
        )
    
    # Save the file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{file_ext}")
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    # Extract text
    try:
        extractor = TextExtractor()
        text_content = extractor.extract(file_path)
        chunks = extractor.chunk_text(text_content)
    except Exception as e:
        safe_remove_file(file_path)
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
    
    # Generate embeddings using LOCAL model (no API key required, no rate limits!)
    try:
        embedding_service = LocalEmbeddingService()
        embeddings = embedding_service.generate_embeddings(chunks)
    except Exception as e:
        safe_remove_file(file_path)
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")
    
    # Store in vector database
    try:
        collection_name = f"doc_{file_id}"
        vector_store = VectorStoreService()
        vector_store.add_documents(
            collection_name=collection_name,
            texts=chunks,
            embeddings=embeddings,
            metadatas=[{"chunk_index": i, "filename": file.filename} for i in range(len(chunks))]
        )
    except Exception as e:
        safe_remove_file(file_path)
        raise HTTPException(status_code=500, detail=f"Error storing embeddings: {str(e)}")
    
    # Save to database
    try:
        document = Document(
            filename=file.filename,
            file_path=file_path,
            content=text_content[:5000],  # Store first 5000 chars
            collection_name=collection_name
        )
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception as e:
        safe_remove_file(file_path)
        raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")
    
    return {
        "id": document.id,
        "filename": document.filename,
        "collection_name": collection_name,
        "chunks_count": len(chunks),
        "message": "Document uploaded and processed successfully"
    }


@router.get("")
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents"""
    documents = db.query(Document).all()
    return [doc.to_dict() for doc in documents]


@router.get("/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a specific document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document.to_dict()


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector store
    try:
        vector_store = VectorStoreService()
        vector_store.delete_collection(document.collection_name)
    except Exception:
        pass  # Collection might not exist
    
    # Delete file
    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}
