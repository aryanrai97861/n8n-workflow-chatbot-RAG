import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../api/client';

export default function Dashboard() {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [newStackDescription, setNewStackDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStacks();
  }, []);

  const loadStacks = async () => {
    try {
      const data = await workflowsApi.list();
      setStacks(data);
    } catch (error) {
      console.error('Failed to load stacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewStack = () => {
    setNewStackName('');
    setNewStackDescription('');
    setShowModal(true);
  };

  const handleCreateStack = async () => {
    if (!newStackName.trim()) {
      alert('Please enter a name for your stack');
      return;
    }

    setCreating(true);
    try {
      const result = await workflowsApi.create({
        name: newStackName.trim(),
        description: newStackDescription.trim(),
        definition: { nodes: [], edges: [] },
      });
      setShowModal(false);
      navigate(`/builder/${result.id}`);
    } catch (error) {
      alert('Failed to create stack: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditStack = (id) => {
    navigate(`/builder/${id}`);
  };

  const handleDeleteStack = async (id) => {
    if (!confirm('Are you sure you want to delete this stack?')) return;
    
    try {
      await workflowsApi.delete(id);
      setStacks(stacks.filter(s => s.id !== id));
    } catch (error) {
      alert('Failed to delete stack: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="logo">
            <span className="logo-icon">✓</span>
            <span>GenAI Stack</span>
          </div>
          <div className="header-right">
            <div className="avatar">S</div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="dashboard-title-row">
            <h1>My Stacks</h1>
          </div>
          <div className="loading-spinner">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-icon">✓</span>
          <span>GenAI Stack</span>
        </div>
        <div className="header-right">
          <div className="avatar">S</div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-row">
          <h1>My Stacks</h1>
          <button className="btn-new-stack" onClick={handleNewStack}>
            + New Stack
          </button>
        </div>

        {stacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-card">
              <h2>Create New Stack</h2>
              <p>Start building your generative AI apps with our essential tools and frameworks</p>
              <button className="btn-new-stack" onClick={handleNewStack}>
                + New Stack
              </button>
            </div>
          </div>
        ) : (
          <div className="stacks-grid">
            {stacks.map((stack) => (
              <div key={stack.id} className="stack-card">
                <h3>{stack.name}</h3>
                <p>{stack.description || 'No description'}</p>
                <div className="stack-card-actions">
                  <button 
                    className="btn-edit-stack"
                    onClick={() => handleEditStack(stack.id)}
                  >
                    Edit Stack
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </button>
                  <button 
                    className="btn-delete-stack"
                    onClick={() => handleDeleteStack(stack.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Stack Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Stack</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newStackName}
                  onChange={(e) => setNewStackName(e.target.value)}
                  placeholder="Chat With PDF"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  value={newStackDescription}
                  onChange={(e) => setNewStackDescription(e.target.value)}
                  placeholder="Chat with your pdf docs"
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-create" 
                onClick={handleCreateStack}
                disabled={creating || !newStackName.trim()}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
