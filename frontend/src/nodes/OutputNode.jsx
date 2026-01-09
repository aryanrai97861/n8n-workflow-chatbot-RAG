import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function OutputNode({ data, selected }) {
  return (
    <div className={`custom-node output-node ${selected ? 'selected' : ''}`}>
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
        id="response"
        className="handle-output"
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
          💬
        </div>
        <span className="node-title">{data.label || 'Output'}</span>
      </div>
      <div className="node-body">
        <p className="node-description">Output of the result nodes as text</p>
        <div className="output-preview">
          <label>Output Text</label>
          <div className="output-preview-box">
            {data.lastResponse || 'Output will be generated based on query'}
          </div>
        </div>
      </div>
    </div>
  );
}
