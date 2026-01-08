import React from 'react';

export default function Header({ onBuildStack, onChatOpen, isBuilt }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>GenAI Stack</span>
        </div>
      </div>
      
      <div className="header-actions">
        <button className="btn btn-success" onClick={onBuildStack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Build Stack
        </button>
        
        <button 
          className="btn btn-primary" 
          onClick={onChatOpen}
          disabled={!isBuilt}
          title={!isBuilt ? 'Build the stack first' : 'Chat with your workflow'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Chat with Stack
        </button>
      </div>
    </header>
  );
}
