const API_BASE_URL = 'http://localhost:8000/api';

// Documents API
export const documentsApi = {
  upload: async (file, apiKey = null, embeddingModel = 'local') => {
    const formData = new FormData();
    formData.append('file', file);
    if (apiKey) {
      formData.append('api_key', apiKey);
    }
    formData.append('embedding_model', embeddingModel);
    
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    
    return response.json();
  },
  
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/documents`);
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Workflows API
export const workflowsApi = {
  create: async (workflow) => {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    return response.json();
  },
  
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/workflows`);
    return response.json();
  },
  
  get: async (id) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`);
    return response.json();
  },
  
  update: async (id, workflow) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Chat/Execute API
export const chatApi = {
  execute: async (workflow, query, config, chatHistory = [], workflowId = null) => {
    const response = await fetch(`${API_BASE_URL}/chat/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow,
        query,
        config,
        workflow_id: workflowId,
        chat_history: chatHistory,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Execution failed');
    }
    
    return response.json();
  },
  
  getHistory: async (workflowId) => {
    const response = await fetch(`${API_BASE_URL}/chat/history/${workflowId}`);
    return response.json();
  },
  
  clearHistory: async (workflowId) => {
    const response = await fetch(`${API_BASE_URL}/chat/history/${workflowId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  
  getLogs: async (executionId) => {
    const response = await fetch(`${API_BASE_URL}/chat/logs/${executionId}`);
    return response.json();
  },
  
  getWorkflowLogs: async (workflowId, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/chat/logs/workflow/${workflowId}?limit=${limit}`);
    return response.json();
  },
};
