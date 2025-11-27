import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(window.location.origin, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('user:online', user._id);
    });

    newSocket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('conversation:join', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('conversation:leave', conversationId);
    }
  };

  const sendMessage = (data) => {
    if (socket) {
      socket.emit('message:send', data);
    }
  };

  const startTyping = (conversationId) => {
    if (socket && user) {
      socket.emit('typing:start', { conversationId, userId: user._id });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket && user) {
      socket.emit('typing:stop', { conversationId, userId: user._id });
    }
  };

  const value = {
    socket,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
