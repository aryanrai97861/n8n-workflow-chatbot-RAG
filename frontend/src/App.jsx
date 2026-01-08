import React, { useState, useCallback } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import Header from './components/Header';
import ComponentLibrary from './components/ComponentLibrary';
import WorkflowCanvas from './components/WorkflowCanvas';
import ConfigPanel from './components/ConfigPanel';
import ChatModal from './components/ChatModal';
import './index.css';

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isBuilt, setIsBuilt] = useState(false);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({
    geminiApiKey: '',
    serpApiKey: '',
  });

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: newData } : node
      )
    );
    // Update selected node
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: newData } : prev));
  }, [setNodes]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateWorkflow = () => {
    // Check if we have at least User Query -> LLM -> Output
    const hasUserQuery = nodes.some((n) => n.type === 'userQuery');
    const hasLLM = nodes.some((n) => n.type === 'llmEngine');
    const hasOutput = nodes.some((n) => n.type === 'output');

    if (!hasUserQuery || !hasLLM || !hasOutput) {
      return {
        valid: false,
        message: 'Workflow must include User Query, LLM Engine, and Output components',
      };
    }

    // Check if LLM Engine has API key configured
    const llmNode = nodes.find((n) => n.type === 'llmEngine');
    if (!llmNode?.data?.apiKey && !config.geminiApiKey) {
      return {
        valid: false,
        message: 'Please configure Gemini API key in LLM Engine',
      };
    }

    // Check connectivity
    const userQueryNode = nodes.find((n) => n.type === 'userQuery');
    const outputNode = nodes.find((n) => n.type === 'output');

    const hasUserQueryConnection = edges.some((e) => e.source === userQueryNode?.id);
    const hasOutputConnection = edges.some((e) => e.target === outputNode?.id);

    if (!hasUserQueryConnection || !hasOutputConnection) {
      return {
        valid: false,
        message: 'Components must be connected in a valid flow',
      };
    }

    return { valid: true };
  };

  const handleBuildStack = () => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }

    setIsBuilt(true);
    showToast('✓ Workflow built successfully! Click "Chat with Stack" to start.', 'success');
  };

  const handleChatOpen = () => {
    if (!isBuilt) {
      showToast('Please build the stack first', 'error');
      return;
    }
    setChatOpen(true);
  };

  const getWorkflowDefinition = () => ({
    nodes: nodes,
    edges: edges,
  });

  const getExecutionConfig = () => {
    // Collect all API keys from nodes
    const llmNode = nodes.find((n) => n.type === 'llmEngine');
    const kbNode = nodes.find((n) => n.type === 'knowledgeBase');

    return {
      geminiApiKey: llmNode?.data?.apiKey || config.geminiApiKey,
      serpApiKey: llmNode?.data?.serpApiKey || config.serpApiKey,
    };
  };

  return (
    <ReactFlowProvider>
      <div className="app">
        <Header onBuildStack={handleBuildStack} onChatOpen={handleChatOpen} isBuilt={isBuilt} />
        
        <div className="main-container">
          <ComponentLibrary />
          
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeSelect={handleNodeSelect}
            onNodeDataUpdate={handleNodeUpdate}
          />
          
          <ConfigPanel
            selectedNode={selectedNode}
            onNodeUpdate={handleNodeUpdate}
            config={config}
            onConfigUpdate={setConfig}
          />
        </div>

        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          workflow={getWorkflowDefinition()}
          config={getExecutionConfig()}
        />

        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type}`}>{toast.message}</div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;
