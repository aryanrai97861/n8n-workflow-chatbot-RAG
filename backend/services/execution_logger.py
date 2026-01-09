from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
import time


@dataclass
class LogEntry:
    """Represents a single execution log entry"""
    step_name: str
    status: str  # "started", "completed", "error"
    message: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ExecutionLogger:
    """
    Collects structured logs during workflow execution.
    Logs are collected in-memory and returned at the end of execution.
    """
    
    def __init__(self, execution_id: str, workflow_id: Optional[int] = None):
        self.execution_id = execution_id
        self.workflow_id = workflow_id
        self.logs: List[LogEntry] = []
        self._step_start_times: Dict[str, float] = {}
    
    def start_step(self, step_name: str, message: str = "", metadata: Optional[Dict] = None):
        """Log the start of a workflow step"""
        self._step_start_times[step_name] = time.time()
        entry = LogEntry(
            step_name=step_name,
            status="started",
            message=message or f"Starting {step_name}",
            metadata=metadata or {}
        )
        self.logs.append(entry)
        print(f"[LOG] {step_name}: started - {entry.message}")
    
    def complete_step(self, step_name: str, message: str = "", metadata: Optional[Dict] = None):
        """Log the successful completion of a workflow step"""
        # Calculate duration if we have a start time
        duration_ms = None
        if step_name in self._step_start_times:
            duration_ms = int((time.time() - self._step_start_times[step_name]) * 1000)
            del self._step_start_times[step_name]
        
        meta = metadata or {}
        if duration_ms is not None:
            meta["duration_ms"] = duration_ms
        
        entry = LogEntry(
            step_name=step_name,
            status="completed",
            message=message or f"Completed {step_name}",
            metadata=meta
        )
        self.logs.append(entry)
        print(f"[LOG] {step_name}: completed - {entry.message} ({duration_ms}ms)")
    
    def error_step(self, step_name: str, error_message: str, metadata: Optional[Dict] = None):
        """Log an error in a workflow step"""
        # Calculate duration if we have a start time
        duration_ms = None
        if step_name in self._step_start_times:
            duration_ms = int((time.time() - self._step_start_times[step_name]) * 1000)
            del self._step_start_times[step_name]
        
        meta = metadata or {}
        if duration_ms is not None:
            meta["duration_ms"] = duration_ms
        
        entry = LogEntry(
            step_name=step_name,
            status="error",
            message=error_message,
            metadata=meta
        )
        self.logs.append(entry)
        print(f"[LOG] {step_name}: ERROR - {error_message}")
    
    def info(self, step_name: str, message: str, metadata: Optional[Dict] = None):
        """Log an informational message for a step"""
        entry = LogEntry(
            step_name=step_name,
            status="info",
            message=message,
            metadata=metadata or {}
        )
        self.logs.append(entry)
        print(f"[LOG] {step_name}: info - {message}")
    
    def get_logs(self) -> List[Dict[str, Any]]:
        """Get all logs as a list of dictionaries"""
        return [log.to_dict() for log in self.logs]
