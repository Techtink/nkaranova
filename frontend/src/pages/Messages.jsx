import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { conversationsAPI, tailorsAPI } from '../services/api';
import './Messages.scss';

// Sewing Needle Typing Indicator Component
function SewingNeedleIndicator() {
  return (
    <div className="typing-indicator">
      <div className="sewing-animation">
        <svg className="needle" viewBox="0 0 24 60" width="12" height="30">
          {/* Needle eye */}
          <ellipse cx="12" cy="6" rx="3" ry="5" fill="#8B7355" />
          {/* Needle body */}
          <rect x="10" y="10" width="4" height="40" rx="1" fill="#A0A0A0" />
          {/* Needle tip */}
          <polygon points="10,50 14,50 12,58" fill="#808080" />
        </svg>
        <div className="thread-container">
          <svg className="thread" viewBox="0 0 80 20" width="60" height="15">
            <path
              className="thread-path"
              d="M0,10 Q10,2 20,10 Q30,18 40,10 Q50,2 60,10 Q70,18 80,10"
              fill="none"
              stroke="#D4A574"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <span className="typing-text">sewing a reply...</span>
    </div>
  );
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, startTyping, stopTyping } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    // Check if starting new conversation with tailor
    const tailorUsername = searchParams.get('tailor');
    if (tailorUsername) {
      startConversationWithTailor(tailorUsername);
    }
  }, []);

  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation._id);
      fetchMessages(activeConversation._id);

      return () => {
        leaveConversation(activeConversation._id);
      };
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!socket) return;

    // Handle typing events from other users - defined here to avoid stale closures
    const onTypingStart = (data) => {
      if (data.conversationId === activeConversation?._id && data.userId !== user._id) {
        setIsOtherTyping(true);
      }
    };

    const onTypingStop = (data) => {
      if (data.conversationId === activeConversation?._id && data.userId !== user._id) {
        setIsOtherTyping(false);
      }
    };

    const onNewMessage = (data) => {
      if (data.conversationId === activeConversation?._id) {
        setMessages(prev => [...prev, data.message]);
        // Stop typing indicator when message received
        setIsOtherTyping(false);
      }

      // Update conversation list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: data.message.content,
                  sender: data.message.sender,
                  sentAt: data.message.createdAt
                },
                unreadCount: conv._id !== activeConversation?._id
                  ? (conv.unreadCount || 0) + 1
                  : 0
              }
            : conv
        )
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, activeConversation?._id, user?._id]);

  // Reset typing state when conversation changes
  useEffect(() => {
    setIsOtherTyping(false);
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await conversationsAPI.getAll();
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startConversationWithTailor = async (username) => {
    try {
      const response = await conversationsAPI.startWithTailor(username);
      const conversation = response.data.data;

      // Add to list if not exists
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });

      setActiveConversation(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await conversationsAPI.getMessages(conversationId);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!activeConversation) return;

    // Start typing
    if (value.trim()) {
      startTyping(activeConversation._id);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeConversation._id);
      }, 2000);
    } else {
      stopTyping(activeConversation._id);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    // Stop typing when sending
    stopTyping(activeConversation._id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    try {
      await conversationsAPI.sendMessage(activeConversation._id, {
        content: newMessage
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== user._id);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="messages-page">
      {/* Conversations List */}
      <div className={`conversations-list ${activeConversation ? 'hidden-mobile' : ''}`}>
        <div className="conversations-header">
          <h2>Messages</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="empty-conversations">
            <p>No conversations yet</p>
            <p className="hint">Start a conversation by messaging a tailor</p>
          </div>
        ) : (
          <div className="conversations">
            {conversations.map(conversation => {
              const other = getOtherParticipant(conversation);
              const isActive = activeConversation?._id === conversation._id;

              return (
                <button
                  key={conversation._id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="avatar avatar-md">
                    {other?.avatar ? (
                      <img src={other.avatar} alt="" />
                    ) : (
                      other?.firstName?.charAt(0)
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {conversation.tailor?.businessName || `${other?.firstName} ${other?.lastName}`}
                    </div>
                    {conversation.lastMessage && (
                      <div className="conversation-preview">
                        {conversation.lastMessage.content?.substring(0, 50)}
                      </div>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`chat-area ${!activeConversation ? 'hidden-mobile' : ''}`}>
        {activeConversation ? (
          <>
            <div className="chat-header">
              <button
                className="back-btn"
                onClick={() => setActiveConversation(null)}
              >
                <FiArrowLeft />
              </button>
              <div className="avatar avatar-sm">
                {getOtherParticipant(activeConversation)?.avatar ? (
                  <img src={getOtherParticipant(activeConversation).avatar} alt="" />
                ) : (
                  getOtherParticipant(activeConversation)?.firstName?.charAt(0)
                )}
              </div>
              <div className="chat-header-info">
                <span className="chat-name">
                  {activeConversation.tailor?.businessName ||
                    `${getOtherParticipant(activeConversation)?.firstName} ${getOtherParticipant(activeConversation)?.lastName}`}
                </span>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`message ${message.sender?._id === user._id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              ))}
              {isOtherTyping && <SewingNeedleIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
              />
              <button type="submit" disabled={!newMessage.trim() || sending}>
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
