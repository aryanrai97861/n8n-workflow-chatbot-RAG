from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ChatLog(Base):
    """Chat log model for storing conversation history"""
    __tablename__ = "chat_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    user_message = Column(Text)
    assistant_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "workflow_id": self.workflow_id,
            "user_message": self.user_message,
            "assistant_message": self.assistant_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
