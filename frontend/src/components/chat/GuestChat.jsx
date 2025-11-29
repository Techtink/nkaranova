import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiUser } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { guestChatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './GuestChat.scss';

// Custom Robot Chat Icon
function RobotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <circle cx="32" cy="8" r="4" fill="currentColor" />
      <rect x="30" y="10" width="4" height="8" fill="currentColor" />

      {/* Robot Head */}
      <rect x="12" y="18" width="40" height="32" rx="8" fill="currentColor" />

      {/* Eyes */}
      <circle cx="24" cy="32" r="5" fill="white" />
      <circle cx="40" cy="32" r="5" fill="white" />
      <circle cx="25" cy="31" r="2" fill="#333" />
      <circle cx="41" cy="31" r="2" fill="#333" />

      {/* Mouth */}
      <rect x="22" y="42" width="20" height="3" rx="1.5" fill="white" />

      {/* Ears/Side panels */}
      <rect x="6" y="28" width="6" height="12" rx="2" fill="currentColor" />
      <rect x="52" y="28" width="6" height="12" rx="2" fill="currentColor" />

      {/* Speech bubble indicator */}
      <circle cx="54" cy="14" r="8" fill="#4CAF50" />
      <ellipse cx="52" cy="20" rx="2" ry="3" fill="#4CAF50" />
    </svg>
  );
}

const GUEST_ID_KEY = 'tc_guest_id';
const CONVERSATION_ID_KEY = 'tc_conversation_id';
const CHAT_GREETED_KEY = 'tc_chat_greeted';
const AUTO_OPEN_DELAY = 3000; // 3 seconds delay before auto-opening

export default function GuestChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [status, setStatus] = useState('waiting');
  const [showGreeting, setShowGreeting] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversation = useCallback(async (convId, gId) => {
    try {
      const response = await guestChatAPI.getConversation(convId, gId);
      setMessages(response.data.data.messages);
      setStatus(response.data.data.status);
    } catch (error) {
      // Conversation might not exist anymore
      localStorage.removeItem(CONVERSATION_ID_KEY);
      setConversationId(null);
    }
  }, []);

  useEffect(() => {
    // Don't run effects for logged-in users
    if (user) return;
    // Check for existing guest session
    const storedGuestId = localStorage.getItem(GUEST_ID_KEY);
    const storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY);
    const hasBeenGreeted = sessionStorage.getItem(CHAT_GREETED_KEY);

    if (storedGuestId) {
      setGuestId(storedGuestId);
      setShowNameInput(false);
    }
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }

    // Auto-open chat with greeting for new visitors (once per session)
    if (!hasBeenGreeted) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
        sessionStorage.setItem(CHAT_GREETED_KEY, 'true');
        // Auto-open after showing greeting bubble
        setTimeout(() => {
          setIsOpen(true);
          setShowGreeting(false);
        }, 2000);
      }, AUTO_OPEN_DELAY);

      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    // Setup socket connection when chat is opened
    if (user) return;
    if (isOpen && guestId) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const socketUrl = apiUrl ? apiUrl.replace('/api', '') : `${window.location.protocol}//${window.location.hostname}:5000`;

      socketRef.current = io(socketUrl, {
        withCredentials: true
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('guest:join', guestId);
      });

      socketRef.current.on('admin:message', (data) => {
        setMessages(prev => [...prev, data.message]);
      });

      socketRef.current.on('conversation:closed', () => {
        setStatus('closed');
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('guest:leave', guestId);
          socketRef.current.disconnect();
        }
      };
    }
  }, [user, isOpen, guestId]);

  useEffect(() => {
    // Load existing conversation if we have the IDs
    if (user) return;
    if (isOpen && conversationId && guestId) {
      loadConversation(conversationId, guestId);
    }
  }, [user, isOpen, conversationId, guestId, loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Don't show chat widget for logged-in users
  if (user) {
    return null;
  }

  const startChat = async () => {
    if (!guestName.trim()) return;

    setLoading(true);
    try {
      const response = await guestChatAPI.start({
        guestId: guestId,
        guestName: guestName.trim(),
        metadata: {
          page: window.location.pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        }
      });

      const data = response.data.data;
      setGuestId(data.guestId);
      setConversationId(data.conversationId);
      setMessages(data.messages);
      setStatus(data.status);
      setShowNameInput(false);

      localStorage.setItem(GUEST_ID_KEY, data.guestId);
      localStorage.setItem(CONVERSATION_ID_KEY, data.conversationId);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || status === 'closed') return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistically add message
    const tempMessage = {
      _id: Date.now(),
      sender: 'guest',
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await guestChatAPI.sendMessage(conversationId, {
        content: messageContent,
        guestId
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageContent);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="guest-chat">
      {/* Greeting Bubble */}
      {showGreeting && !isOpen && (
        <div className="greeting-bubble" onClick={() => { setIsOpen(true); setShowGreeting(false); }}>
          <p>Hi there! Need help finding a tailor?</p>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        className={`chat-toggle ${isOpen ? 'open' : ''} ${showGreeting ? 'pulse' : ''}`}
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <FiX /> : <RobotIcon className="robot-icon" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <RobotIcon className="header-robot-icon" />
              <div>
                <h4>Chat with Us</h4>
                <span className={`status-indicator ${status}`}>
                  {status === 'active' ? 'Online' : status === 'closed' ? 'Closed' : 'Waiting for reply'}
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="chat-body">
            {showNameInput ? (
              <div className="name-input-section">
                <div className="welcome-message">
                  <FiUser className="welcome-icon" />
                  <h3>Welcome to Tailor Connect!</h3>
                  <p>Enter your name to start chatting with our team.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); startChat(); }}>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" disabled={loading || !guestName.trim()}>
                    {loading ? 'Starting...' : 'Start Chat'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="messages">
                  {messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      className={`message ${msg.sender === 'guest' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {status === 'closed' ? (
                  <div className="chat-closed-notice">
                    This conversation has been closed.
                  </div>
                ) : (
                  <form className="message-input" onSubmit={sendMessage}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                      <FiSend />
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
