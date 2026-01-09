import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../api/client';

export default function ChatModal({ isOpen, onClose, workflow, config, workflowId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when modal opens and we have a workflowId
  useEffect(() => {
    if (isOpen && workflowId && !historyLoaded) {
      loadChatHistory();
    }
  }, [isOpen, workflowId]);

  // Reset history loaded flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHistoryLoaded(false);
      setExecutionLogs([]);
      setShowLogs(false);
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const history = await chatApi.getHistory(workflowId);
      if (history && history.length > 0) {
        setMessages(history);
      }
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setHistoryLoaded(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setExecutionLogs([]);
    
    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Send the current message history (excluding the just-added user message) as chat_history
      // Also pass workflowId to persist the chat
      const result = await chatApi.execute(workflow, userMessage, config, messages, workflowId);
      
      // Store execution logs
      if (result.logs && result.logs.length > 0) {
        setExecutionLogs(result.logs);
        setShowLogs(true);
      }
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!workflowId) return;
    if (!confirm('Are you sure you want to clear chat history?')) return;
    
    try {
      await chatApi.clearHistory(workflowId);
      setMessages([]);
      setExecutionLogs([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'started':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'started':
        return 'log-status-started';
      case 'completed':
        return 'log-status-completed';
      case 'error':
        return 'log-status-error';
      case 'info':
        return 'log-status-info';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <h3>
            <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Chat with GenAI Stack
          </h3>
          <div className="chat-header-actions">
            {executionLogs.length > 0 && (
              <button 
                className={`btn-toggle-logs ${showLogs ? 'active' : ''}`}
                onClick={() => setShowLogs(!showLogs)} 
                title="Toggle execution logs"
              >
                📊
              </button>
            )}
            {workflowId && messages.length > 0 && (
              <button className="btn-clear-history" onClick={handleClearHistory} title="Clear history">
                🗑
              </button>
            )}
            <button className="chat-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="chat-content-wrapper">
          {/* Execution Logs Panel */}
          {showLogs && executionLogs.length > 0 && (
            <div className="execution-logs-panel">
              <div className="logs-header">
                <span>Execution Logs</span>
                <button className="logs-close" onClick={() => setShowLogs(false)}>×</button>
              </div>
              <div className="logs-content">
                {executionLogs.map((log, index) => (
                  <div key={index} className={`log-entry ${getStatusClass(log.status)}`}>
                    <div className="log-step-header">
                      <span className="log-icon">{getStatusIcon(log.status)}</span>
                      <span className="log-step-name">{log.step_name}</span>
                      {log.metadata?.duration_ms && (
                        <span className="log-duration">{log.metadata.duration_ms}ms</span>
                      )}
                    </div>
                    <div className="log-message">{log.message}</div>
                    {log.metadata && Object.keys(log.metadata).filter(k => k !== 'duration_ms').length > 0 && (
                      <div className="log-metadata">
                        {Object.entries(log.metadata)
                          .filter(([key]) => key !== 'duration_ms')
                          .map(([key, value]) => (
                            <span key={key} className="log-meta-item">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-message assistant">
                <div className="message-avatar assistant">🤖</div>
                <div className="message-content">
                  Hello! I'm ready to help you with your workflow. Ask me anything!
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <div className={`message-avatar ${message.role}`}>
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-message assistant">
                <div className="message-avatar assistant">🤖</div>
                <div className="message-content">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form className="chat-input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={loading}
          />
          <button type="submit" className="chat-send" disabled={loading || !input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
