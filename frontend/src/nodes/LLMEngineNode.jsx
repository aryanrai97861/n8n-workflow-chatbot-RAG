import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function LLMEngineNode({ data, selected }) {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
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
      <p>Model: {data.model || 'Gemini 2.0 Flash'}</p>
        {data.enableWebSearch && <p>🔍 Web Search enabled</p>}
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
