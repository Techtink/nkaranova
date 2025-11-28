import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiUser, FiClock, FiSend, FiX, FiRefreshCw } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { guestChatAPI } from '../../services/api';
import './Admin.scss';

export default function AdminGuestChats() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    // Setup socket connection
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl ? apiUrl.replace('/api', '') : `${window.location.protocol}//${window.location.hostname}:5000`;

    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('admin:join-chat');
    });

    socketRef.current.on('guest:message', (data) => {
      // Refresh conversations list
      fetchConversations();

      // If viewing this conversation, add the message
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('admin:leave-chat');
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await guestChatAPI.getConversations(params);
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await guestChatAPI.getConversationById(conversation._id);
      setMessages(response.data.data.messages);
      // Update conversation in list to show it's been read
      setConversations(prev => prev.map(c =>
        c._id === conversation._id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    // Optimistically add message
    const tempMessage = {
      _id: Date.now(),
      sender: 'admin',
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await guestChatAPI.sendAdminMessage(selectedConversation._id, messageContent);
      // Update conversation status in list
      setConversations(prev => prev.map(c =>
        c._id === selectedConversation._id ? { ...c, status: 'active' } : c
      ));
      setSelectedConversation(prev => ({ ...prev, status: 'active' }));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedConversation) return;

    try {
      await guestChatAPI.closeConversation(selectedConversation._id);
      setSelectedConversation(prev => ({ ...prev, status: 'closed' }));
      setConversations(prev => prev.map(c =>
        c._id === selectedConversation._id ? { ...c, status: 'closed' } : c
      ));
      fetchConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page guest-chats-page">
      <div className="guest-chats-header">
        <div>
          <h1>Guest Chats</h1>
          <p>Respond to visitor inquiries</p>
        </div>
        <button className="refresh-btn" onClick={fetchConversations}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

        <div className="chat-layout">
          {/* Conversations List */}
          <div className="conversations-panel">
            <div className="panel-header">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Chats</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-list">
                  <FiMessageCircle />
                  <p>No conversations</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="conv-avatar">
                      <FiUser />
                    </div>
                    <div className="conv-info">
                      <div className="conv-header">
                        <span className="conv-name">{conv.guestName}</span>
                        <span className="conv-time">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="conv-preview">
                        <span className={`status-dot ${conv.status}`} />
                        <span className="status-text">{conv.status}</span>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="user-avatar">
                      <FiUser />
                    </div>
                    <div>
                      <h3>{selectedConversation.guestName}</h3>
                      <span className={`status ${selectedConversation.status}`}>
                        {selectedConversation.status}
                      </span>
                    </div>
                  </div>
                  <div className="chat-actions">
                    {selectedConversation.status !== 'closed' && (
                      <button className="close-chat-btn" onClick={closeConversation}>
                        <FiX /> Close Chat
                      </button>
                    )}
                  </div>
                </div>

                <div className="messages-container">
                  {messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      className={`message ${msg.sender === 'admin' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedConversation.status !== 'closed' ? (
                  <form className="message-input" onSubmit={sendMessage}>
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim() || sendingMessage}>
                      <FiSend />
                    </button>
                  </form>
                ) : (
                  <div className="closed-notice">
                    This conversation has been closed
                  </div>
                )}
              </>
            ) : (
              <div className="no-chat-selected">
                <FiMessageCircle />
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start responding</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
