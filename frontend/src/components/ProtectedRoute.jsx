import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Check both isAuthenticated (user loaded) and token (just logged in)
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  // If we have a token but no user yet, show loading
  if (token && !isAuthenticated) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return children;
}

