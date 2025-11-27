import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tailorProfile, setTailorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      setTailorProfile(response.data.tailorProfile);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // If tailor, fetch profile
    if (userData.role === 'tailor') {
      const meResponse = await authAPI.getMe();
      setTailorProfile(meResponse.data.tailorProfile);
    }

    return userData;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    if (userData.role === 'tailor') {
      const meResponse = await authAPI.getMe();
      setTailorProfile(meResponse.data.tailorProfile);
    }

    return userData;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API fails
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTailorProfile(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...updates }));
  };

  const updateTailorProfile = (updates) => {
    setTailorProfile(prev => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    tailorProfile,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTailor: user?.role === 'tailor',
    isCustomer: user?.role === 'customer',
    login,
    register,
    logout,
    updateUser,
    updateTailorProfile,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
