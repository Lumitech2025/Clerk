import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // 1. Prevent premature redirects while checking local storage/session
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617',
        color: '#10b981'
      }}>
        <p>Loading CCIS Session...</p>
      </div>
    );
  }

  // 2. Check token or user object presence
  const hasToken = localStorage.getItem('accessToken');

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;