import React, { createContext, useState, useEffect } from 'react';
import API, { setAuthToken } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent session restore on app startup using HttpOnly refresh cookie
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await API.post('/auth/refresh/');
        const newAccess = response.data.access;
        const userData = response.data.user || null;

        setAccessToken(newAccess);
        setAuthToken(newAccess);
        if (userData) setUser(userData);
      } catch (err) {
        // No active session cookie found
        setAccessToken(null);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, tokens) => {
    setUser(userData);
    setAccessToken(tokens.access);
    setAuthToken(tokens.access);
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout/');
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};