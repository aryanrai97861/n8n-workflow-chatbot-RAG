import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function LLMEngineNode({ data, selected }) {
  return (
    <div className={`custom-node llm-node ${selected ? 'selected' : ''}`}>
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
        style={{ top: '35%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="context"
        className="handle-context"
        style={{ top: '65%' }}
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
          🤖
        </div>
        <span className="node-title">{data.label || 'LLM Engine'}</span>
      </div>
      <div className="node-body">
        <p className="node-description">Model: {data.model || 'Gemini 2.5 Flash'}</p>
        {data.enableWebSearch && <p className="web-search-badge">🔍 Web Search enabled</p>}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="handle-output"
      />
    </div>
  );
}
