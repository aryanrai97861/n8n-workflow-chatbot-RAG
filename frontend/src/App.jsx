import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkflowBuilder from './pages/WorkflowBuilder';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/builder" element={<WorkflowBuilder />} />
        <Route path="/builder/:id" element={<WorkflowBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;
