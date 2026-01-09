import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function KnowledgeBaseNode({ data, selected }) {
  return (
    <div className={`custom-node kb-node ${selected ? 'selected' : ''}`}>
      {data.onDelete && (
        <button 
          className="node-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete();
          }}
        >
          ×
        </button>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle-query"
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
          📚
        </div>
        <span className="node-title">{data.label || 'Knowledge Base'}</span>
      </div>
      <div className="node-body">
        {data.filename ? (
          <div className="kb-file-info">
            <span className="file-icon">📄</span>
            <span className="file-name">{data.filename}</span>
          </div>
        ) : (
          <p className="node-description">Upload a document to configure</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="context"
        className="handle-context"
      />
    </div>
  );
}
