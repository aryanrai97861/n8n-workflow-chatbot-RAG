import React from 'react';

const components = [
  {
    type: 'userQuery',
    label: 'User Query',
    description: 'Entry point for user input',
    iconClass: 'query',
    icon: '❓',
  },
  {
    type: 'knowledgeBase',
    label: 'Knowledge Base',
    description: 'Document processing & retrieval',
    iconClass: 'kb',
    icon: '📚',
  },
  {
    type: 'llmEngine',
    label: 'LLM Engine',
    description: 'AI-powered response generation',
    iconClass: 'llm',
    icon: '🤖',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Display the final response',
    iconClass: 'output',
    icon: '💬',
  },
];

export default function ComponentLibrary() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Components</div>
      <div className="component-list">
        {components.map((component) => (
          <div
            key={component.type}
            className="component-item"
            draggable
            onDragStart={(e) => onDragStart(e, component.type)}
          >
            <div className={`component-icon ${component.iconClass}`}>
              {component.icon}
            </div>
            <div className="component-info">
              <h4>{component.label}</h4>
              <p>{component.description}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
