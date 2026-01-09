from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid

from database import get_db
from models.chat import ChatLog
from models.execution_log import ExecutionLog
from models.user import User
from engine.executor import WorkflowExecutor
from services.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessageItem(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ExecuteRequest(BaseModel):
    workflow: Dict[str, Any]  # Contains nodes and edges
    query: str
    config: Dict[str, Any]  # API keys and other config
    workflow_id: Optional[int] = None
    chat_history: Optional[List[ChatMessageItem]] = None


@router.post("/execute")
async def execute_workflow(
    request: ExecuteRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow with a user query"""
    try:
        execution_id = str(uuid.uuid4())
        executor = WorkflowExecutor()
        
        history = None
        if request.chat_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
        
        result = executor.execute(
            workflow_definition=request.workflow,
            user_query=request.query,
            config=request.config,
            chat_history=history,
            execution_id=execution_id,
            workflow_id=request.workflow_id
        )
        
        response = result["response"]
        logs = result.get("logs", [])
        
        # Save execution logs
        for log in logs:
            db_log = ExecutionLog(
                execution_id=execution_id,
                workflow_id=request.workflow_id,
                step_name=log["step_name"],
                status=log["status"],
                message=log["message"],
                log_metadata=log.get("metadata")
            )
            db.add(db_log)
        
        # Save chat log with user_id
        if request.workflow_id:
            chat_log = ChatLog(
                user_id=current_user.id,
                workflow_id=request.workflow_id,
                user_message=request.query,
                assistant_message=response
            )
            db.add(chat_log)
        
        db.commit()
        
        return {
            "response": response,
            "query": request.query,
            "execution_id": execution_id,
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


@router.get("/history/{workflow_id}")
async def get_chat_history(
    workflow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a workflow owned by current user"""
    logs = db.query(ChatLog).filter(
        ChatLog.workflow_id == workflow_id,
        ChatLog.user_id == current_user.id
    ).order_by(ChatLog.created_at).all()
    
    messages = []
    for log in logs:
        messages.append({"role": "user", "content": log.user_message})
        messages.append({"role": "assistant", "content": log.assistant_message})
    
    return messages


@router.delete("/history/{workflow_id}")
async def clear_chat_history(
    workflow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for a workflow owned by current user"""
    db.query(ChatLog).filter(
        ChatLog.workflow_id == workflow_id,
        ChatLog.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}


@router.get("/logs/{execution_id}")
async def get_execution_logs(
    execution_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get execution logs for a specific execution"""
    logs = db.query(ExecutionLog).filter(
        ExecutionLog.execution_id == execution_id
    ).order_by(ExecutionLog.created_at).all()
    
    return [log.to_dict() for log in logs]


@router.get("/logs/workflow/{workflow_id}")
async def get_workflow_execution_logs(
    workflow_id: int, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent execution logs for a workflow"""
    logs = db.query(ExecutionLog).filter(
        ExecutionLog.workflow_id == workflow_id
    ).order_by(ExecutionLog.created_at.desc()).limit(limit).all()
    
    return [log.to_dict() for log in reversed(logs)]
