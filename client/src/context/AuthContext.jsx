import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, getAccessToken } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
        } catch (err) {
          console.error('Failed to restore session:', err);
          setAccessToken(null);
          setUser(null);
        }
      } else {
        // Try refreshing token once if refresh cookie exists
        try {
          const res = await api.post('/auth/refresh');
          setAccessToken(res.data.data.accessToken);
          setUser(res.data.data.user);
        } catch (err) {
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleGlobalLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data.data;
      setAccessToken(accessToken);
      setUser(userData);
      toast.success('Successfully logged in!');
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { accessToken, user: userData } = res.data.data;
      setAccessToken(accessToken);
      setUser(userData);
      toast.success('Registration successful! Welcome aboard.');
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      toast.success('Logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
