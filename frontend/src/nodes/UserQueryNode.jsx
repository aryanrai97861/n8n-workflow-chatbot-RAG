import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function UserQueryNode({ data, selected }) {
  return (
    <div className={`custom-node user-query-node ${selected ? 'selected' : ''}`}>
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
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
          ❓
        </div>
        <span className="node-title">{data.label || 'User Query'}</span>
      </div>
      <div className="node-body">
        <p className="node-description">Entry point for user queries</p>
        <div className="node-input-preview">
          <label>Query</label>
          <div className="query-preview-box">
            {data.queryTemplate 
              ? (data.queryTemplate.length > 50 
                  ? data.queryTemplate.substring(0, 50) + '...' 
                  : data.queryTemplate)
              : 'Write your query here'}
          </div>
        </div>
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
