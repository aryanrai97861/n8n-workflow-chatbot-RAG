from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ExecutionLog(Base):
    """Execution log model for storing workflow execution steps"""
    __tablename__ = "execution_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(36), index=True, nullable=False)  # UUID for grouping logs
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    step_name = Column(String(100), nullable=False)  # e.g., "User Query", "Knowledge Base"
    status = Column(String(20), nullable=False)  # "started", "completed", "error"
    message = Column(Text)
    log_metadata = Column(JSON, nullable=True)  # Additional data like timing, counts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "execution_id": self.execution_id,
            "workflow_id": self.workflow_id,
            "step_name": self.step_name,
            "status": self.status,
            "message": self.message,
            "metadata": self.log_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

