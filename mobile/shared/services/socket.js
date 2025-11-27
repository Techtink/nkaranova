import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import config from '../config/env';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  async connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    this.socket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  sendMessage(conversationId, content) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { conversationId, content });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('message-sent', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  emitTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId });
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new-message');
    }
  }

  offMessageSent() {
    if (this.socket) {
      this.socket.off('message-sent');
    }
  }

  offUserTyping() {
    if (this.socket) {
      this.socket.off('user-typing');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
