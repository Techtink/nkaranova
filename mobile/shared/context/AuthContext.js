import { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import notificationService from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Register for push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      registerPushNotifications();
    }
  }, [isAuthenticated, user]);

  const registerPushNotifications = async () => {
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      setPushToken(token);
      await notificationService.savePushToken(token);
    }
  };

  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
    if (ref) {
      notificationService.setupNotificationListeners(ref);
    }
  };

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await authAPI.getMe();
        const userData = response.data.data;

        // Check if user has the required role for this app
        if (requiredRole && userData.role !== requiredRole) {
          await logout();
          return;
        }

        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user: userData } = response.data;

    // Check if user has the required role for this app
    if (requiredRole && userData.role !== requiredRole) {
      throw new Error(`This app is for ${requiredRole}s only`);
    }

    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token, user: newUser } = response.data;

    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));

    setUser(newUser);
    setIsAuthenticated(true);

    return newUser;
  };

  const logout = async () => {
    try {
      // Remove push token before logout
      await notificationService.removePushToken();
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    }

    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');

    setPushToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        pushToken,
        login,
        register,
        logout,
        updateUser,
        checkAuth,
        setNavigationRef
      }}
    >
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
