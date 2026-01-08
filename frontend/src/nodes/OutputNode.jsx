import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function OutputNode({ data, selected }) {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
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
        <p>Final response display</p>
      </div>
    </div>
  );
}
