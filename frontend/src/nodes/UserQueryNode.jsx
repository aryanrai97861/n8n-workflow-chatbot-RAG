import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function UserQueryNode({ data, selected }) {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
          ❓
        </div>
        <span className="node-title">{data.label || 'User Query'}</span>
      </div>
      <div className="node-body">
        <p>Entry point for user queries</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="query"
        className="handle-query"
      />
    </div>
  );
}
