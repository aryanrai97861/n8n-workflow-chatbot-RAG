import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import ComponentLibrary from '../components/ComponentLibrary';
import WorkflowCanvas from '../components/WorkflowCanvas';
import ConfigPanel from '../components/ConfigPanel';
import ChatModal from '../components/ChatModal';
import { workflowsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const initialNodes = [];
const initialEdges = [];

function WorkflowBuilderContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user, logout } = useAuth();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isBuilt, setIsBuilt] = useState(false);
  const [toast, setToast] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Stack');
  const [workflowId, setWorkflowId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [config, setConfig] = useState({
    geminiApiKey: '',
    serpApiKey: '',
  });

  // Load existing workflow if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadWorkflow(id);
    }
  }, [id, isEditMode]);

  const loadWorkflow = async (workflowId) => {
    try {
      const workflow = await workflowsApi.get(workflowId);
      setWorkflowName(workflow.name);
      setWorkflowId(workflow.id);
      
      if (workflow.definition) {
        setNodes(workflow.definition.nodes || []);
        setEdges(workflow.definition.edges || []);
      }
    } catch (error) {
      showToast('Failed to load workflow: ' + error.message, 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

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
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: newData } : prev));
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode((prev) => (prev?.id === nodeId ? null : prev));
  }, [setNodes, setEdges]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateWorkflow = () => {
    const hasUserQuery = nodes.some((n) => n.type === 'userQuery');
    const hasLLM = nodes.some((n) => n.type === 'llmEngine');
    const hasOutput = nodes.some((n) => n.type === 'output');

    if (!hasUserQuery || !hasLLM || !hasOutput) {
      return {
        valid: false,
        message: 'Workflow must include User Query, LLM Engine, and Output components',
      };
    }

    const llmNode = nodes.find((n) => n.type === 'llmEngine');
    if (!llmNode?.data?.apiKey && !config.geminiApiKey) {
      return {
        valid: false,
        message: 'Please configure Gemini API key in LLM Engine',
      };
    }

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

  const handleSave = async () => {
    if (nodes.length === 0) {
      showToast('Please add some components before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const definition = { nodes, edges };
      
      if (workflowId) {
        // Update existing
        await workflowsApi.update(workflowId, {
          name: workflowName,
          definition,
        });
        showToast('Workflow saved successfully!', 'success');
      } else {
        // Create new
        const result = await workflowsApi.create({
          name: workflowName,
          definition,
        });
        setWorkflowId(result.id);
        showToast('Workflow created successfully!', 'success');
        // Update URL without full navigation
        window.history.replaceState(null, '', `/builder/${result.id}`);
      }
    } catch (error) {
      showToast('Failed to save: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChatOpen = () => {
    if (!isBuilt) {
      showToast('Please build the stack first', 'error');
      return;
    }
    setChatOpen(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  const getWorkflowDefinition = () => ({
    nodes: nodes,
    edges: edges,
  });

  const getExecutionConfig = () => {
    const llmNode = nodes.find((n) => n.type === 'llmEngine');
    return {
      geminiApiKey: llmNode?.data?.apiKey || config.geminiApiKey,
      serpApiKey: llmNode?.data?.serpApiKey || config.serpApiKey,
    };
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="btn-back" onClick={handleBack}>
            ←
          </button>
          <input
            type="text"
            className="workflow-name-input"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Untitled Stack"
          />
          <span className="edit-icon">✏️</span>
        </div>
        <div className="header-right">
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <span className="user-name">{user?.name}</span>
          <div className="avatar" title={user?.email}>{getUserInitial()}</div>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>
      
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
          onDeleteNode={handleDeleteNode}
        />
        
        <ConfigPanel
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
          config={config}
          onConfigUpdate={setConfig}
        />
      </div>

      {/* Build and Chat buttons */}
      <div className="execution-controls">
        <button 
          className={`btn-build ${isBuilt ? 'built' : ''}`}
          onClick={handleBuildStack}
        >
          ▶
        </button>
        <button 
          className="btn-chat"
          onClick={handleChatOpen}
          disabled={!isBuilt}
        >
          Chat with Stack
          💬
        </button>
      </div>

      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        workflow={getWorkflowDefinition()}
        config={getExecutionConfig()}
        workflowId={workflowId}
      />

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
