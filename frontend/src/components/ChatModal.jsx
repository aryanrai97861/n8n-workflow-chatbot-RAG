import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../api/client';

export default function ChatModal({ isOpen, onClose, workflow, config }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Send the current message history (excluding the just-added user message) as chat_history
      // The backend will use this for context
      const result = await chatApi.execute(workflow, userMessage, config, messages);
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
          <button className="chat-close" onClick={onClose}>×</button>
        </div>

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
