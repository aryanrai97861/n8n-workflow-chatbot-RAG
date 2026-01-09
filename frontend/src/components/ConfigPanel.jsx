import React, { useState, useRef } from 'react';
import { documentsApi } from '../api/client';

export default function ConfigPanel({ selectedNode, onNodeUpdate, config, onConfigUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);

  if (!selectedNode) {
    return (
      <aside className="config-panel">
        <div className="config-header">
          <h3>Configuration</h3>
        </div>
        <div className="config-empty">
          Select a component to configure its settings
        </div>
      </aside>
    );
  }

  const { type, data } = selectedNode;

  const handleChange = (key, value) => {
    onNodeUpdate(selectedNode.id, { ...data, [key]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const apiKey = data.apiKey || config.geminiApiKey;
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    setUploading(true);
    try {
      const result = await documentsApi.upload(file, apiKey);
      handleChange('collectionName', result.collection_name);
      handleChange('documentId', result.id);
      handleChange('filename', result.filename);
      setDocuments([...documents, result]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const renderUserQueryConfig = () => (
    <>
      <div className="form-group">
        <label className="form-label">Component Label</label>
        <input
          type="text"
          className="form-input"
          value={data.label || 'User Query'}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="User Query"
        />
      </div>
    </>
  );

  const renderKnowledgeBaseConfig = () => (
    <>
      <div className="form-group">
        <label className="form-label">Gemini API Key</label>
        <input
          type="password"
          className="form-input"
          value={data.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Enter API key"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Upload Document</label>
        <div 
          className="file-upload"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="file-upload-icon">📄</div>
          <p>
            {uploading ? 'Uploading...' : (
              <>Drop a file or <span>browse</span></>
            )}
          </p>
          <p>Supports PDF, TXT, MD</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {data.filename && (
        <div className="form-group">
          <label className="form-label">Uploaded Document</label>
          <div className="document-list">
            <div className="document-item">
              <span className="doc-name">
                <span className="doc-icon">📄</span>
                {data.filename}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderLLMEngineConfig = () => (
    <>
      <div className="form-group">
        <label className="form-label">Gemini API Key</label>
        <input
          type="password"
          className="form-input"
          value={data.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Enter API key"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Model</label>
        <select
          className="form-input form-select"
          value={data.model || 'gemini-2.5-flash'}
          onChange={(e) => handleChange('model', e.target.value)}
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">System Prompt</label>
        <textarea
          className="form-input form-textarea"
          value={data.prompt || ''}
          onChange={(e) => handleChange('prompt', e.target.value)}
          placeholder="You are a helpful assistant. Use the provided context to answer questions accurately."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Temperature: {data.temperature || 0.7}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={data.temperature || 0.7}
          onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-group form-toggle">
        <label className="form-label">Enable Web Search</label>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={data.enableWebSearch || false}
            onChange={(e) => handleChange('enableWebSearch', e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {data.enableWebSearch && (
        <div className="form-group">
          <label className="form-label">SerpAPI Key</label>
          <input
            type="password"
            className="form-input"
            value={data.serpApiKey || ''}
            onChange={(e) => handleChange('serpApiKey', e.target.value)}
            placeholder="Enter SerpAPI key"
          />
        </div>
      )}
    </>
  );

  const renderOutputConfig = () => (
    <>
      <div className="form-group">
        <label className="form-label">Component Label</label>
        <input
          type="text"
          className="form-input"
          value={data.label || 'Output'}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Output"
        />
      </div>
    </>
  );

  const getTitle = () => {
    switch (type) {
      case 'userQuery': return 'User Query Settings';
      case 'knowledgeBase': return 'Knowledge Base Settings';
      case 'llmEngine': return 'LLM Engine Settings';
      case 'output': return 'Output Settings';
      default: return 'Settings';
    }
  };

  const renderConfig = () => {
    switch (type) {
      case 'userQuery': return renderUserQueryConfig();
      case 'knowledgeBase': return renderKnowledgeBaseConfig();
      case 'llmEngine': return renderLLMEngineConfig();
      case 'output': return renderOutputConfig();
      default: return null;
    }
  };

  return (
    <aside className="config-panel">
      <div className="config-header">
        <h3>{getTitle()}</h3>
      </div>
      <div className="config-body">
        {renderConfig()}
      </div>
    </aside>
  );
}
