from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional

from database import get_db
from models.workflow import Workflow
from models.user import User
from services.auth import get_current_user

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


class WorkflowCreate(BaseModel):
    name: str
    definition: Dict[str, Any]  # Contains nodes and edges


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None


@router.post("")
async def create_workflow(
    workflow: WorkflowCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow for the current user"""
    try:
        db_workflow = Workflow(
            user_id=current_user.id,
            name=workflow.name,
            definition=workflow.definition
        )
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        return db_workflow.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating workflow: {str(e)}")


@router.get("")
async def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all workflows for the current user"""
    workflows = db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
    return [w.to_dict() for w in workflows]


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific workflow owned by the current user"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow.to_dict()


@router.put("/{workflow_id}")
async def update_workflow(
    workflow_id: int, 
    workflow_update: WorkflowUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a workflow owned by the current user"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow_update.name is not None:
        workflow.name = workflow_update.name
    if workflow_update.definition is not None:
        workflow.definition = workflow_update.definition
    
    db.commit()
    db.refresh(workflow)
    return workflow.to_dict()


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow owned by the current user"""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    
    return {"message": "Workflow deleted successfully"}
