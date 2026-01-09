from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from database import get_db
from models.chat import ChatLog
from engine.executor import WorkflowExecutor

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessageItem(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ExecuteRequest(BaseModel):
    workflow: Dict[str, Any]  # Contains nodes and edges
    query: str
    config: Dict[str, Any]  # API keys and other config
    workflow_id: Optional[int] = None
    chat_history: Optional[List[ChatMessageItem]] = None  # Previous messages for context


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


@router.post("/execute")
async def execute_workflow(request: ExecuteRequest, db: Session = Depends(get_db)):
    """Execute a workflow with a user query"""
    try:
        executor = WorkflowExecutor()
        
        # Convert chat history to list of dicts
        history = None
        if request.chat_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
        
        response = executor.execute(
            workflow_definition=request.workflow,
            user_query=request.query,
            config=request.config,
            chat_history=history
        )
        
        # Save to chat log if workflow_id provided
        if request.workflow_id:
            chat_log = ChatLog(
                workflow_id=request.workflow_id,
                user_message=request.query,
                assistant_message=response
            )
            db.add(chat_log)
            db.commit()
        
        return {
            "response": response,
            "query": request.query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


@router.get("/history/{workflow_id}")
async def get_chat_history(workflow_id: int, db: Session = Depends(get_db)):
    """Get chat history for a workflow"""
    logs = db.query(ChatLog).filter(
        ChatLog.workflow_id == workflow_id
    ).order_by(ChatLog.created_at).all()
    
    messages = []
    for log in logs:
        messages.append({"role": "user", "content": log.user_message})
        messages.append({"role": "assistant", "content": log.assistant_message})
    
    return messages


@router.delete("/history/{workflow_id}")
async def clear_chat_history(workflow_id: int, db: Session = Depends(get_db)):
    """Clear chat history for a workflow"""
    db.query(ChatLog).filter(ChatLog.workflow_id == workflow_id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
