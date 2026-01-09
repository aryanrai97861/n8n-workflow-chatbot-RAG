import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import UserQueryNode from '../nodes/UserQueryNode';
import KnowledgeBaseNode from '../nodes/KnowledgeBaseNode';
import LLMEngineNode from '../nodes/LLMEngineNode';
import OutputNode from '../nodes/OutputNode';

const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
};

let id = 0;
const getId = () => `node_${id++}`;

export default function WorkflowCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeSelect,
  onNodeDataUpdate,
  onDeleteNode
}) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = getId();
      const newNode = {
        id: nodeId,
        type,
        position,
        data: { 
          label: getDefaultLabel(type),
          onDelete: () => onDeleteNode(nodeId),
        },
      };

      onNodesChange([{ type: 'add', item: newNode }]);
    },
    [reactFlowInstance, onNodesChange, onDeleteNode]
  );

  const getDefaultLabel = (type) => {
    switch (type) {
      case 'userQuery': return 'User Query';
      case 'knowledgeBase': return 'Knowledge Base';
      case 'llmEngine': return 'LLM Engine';
      case 'output': return 'Output';
      default: return 'Node';
    }
  };

  const handleNodeClick = useCallback((event, node) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Enhance nodes with onDelete callback
  const enhancedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: () => onDeleteNode(node.id),
    }
  }));

  return (
    <div className="workspace" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background color="#E5E7EB" gap={16} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'userQuery': return '#F59E0B';
              case 'knowledgeBase': return '#8B5CF6';
              case 'llmEngine': return '#3B82F6';
              case 'output': return '#22C55E';
              default: return '#E5E7EB';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
