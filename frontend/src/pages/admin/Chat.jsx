import { useState, useEffect, useRef } from 'react';
import {
  FiMessageCircle, FiUser, FiSend, FiSearch,
  FiMail, FiPhone, FiMapPin, FiCalendar, FiStar, FiPlus
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import { adminAPI } from '../../services/api';
import './Admin.scss';

export default function AdminChat() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchUsers();

    // Setup socket connection
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl ? apiUrl.replace('/api', '') : `${window.location.protocol}//${window.location.hostname}:5000`;

    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('message:new', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Join conversation room when selected
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('join:conversation', selectedConversation._id);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await adminAPI.getChatUsers(params);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    try {
      // Start or get existing conversation
      const convResponse = await adminAPI.startConversationWithUser(user._id);
      setSelectedConversation(convResponse.data.data);

      // Load messages
      const msgResponse = await adminAPI.getConversationMessages(convResponse.data.data._id);
      setMessages(msgResponse.data.data);
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
      sender: { _id: 'admin' },
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await adminAPI.sendChatMessage(selectedConversation._id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUserDisplayName = (user) => {
    if (user.role === 'tailor' && user.tailorProfile?.businessName) {
      return user.tailorProfile.businessName;
    }
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (user) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page admin-chat-page page">
      <div className="chat-three-column">
        {/* Left Panel - Users List */}
        <div className="users-panel">
          <div className="users-panel-header">
            <div className="header-title">
              <h2>Users</h2>
              <div className="filter-select">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Users</option>
                  <option value="customer">Customers</option>
                  <option value="tailor">Tailors</option>
                </select>
              </div>
            </div>
            <div className="search-input">
              <span className="search-icon"><FiSearch /></span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="users-list">
            {users.length === 0 ? (
              <div className="empty-list">
                <FiUser />
                <p>No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className={`user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                  onClick={() => selectUser(user)}
                >
                  <div className="user-avatar">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.firstName} />
                    ) : (
                      <span className="avatar-initials">{getUserInitials(user)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{getUserDisplayName(user)}</span>
                    <span className="user-meta">
                      {user.location?.city || 'Unknown'} • {user.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Panel - User Details */}
        <div className="user-details-panel">
          {selectedUser ? (
            <>
              <div className="details-header">
                <div className="profile-avatar">
                  {selectedUser.profileImage ? (
                    <img src={selectedUser.profileImage} alt={selectedUser.firstName} />
                  ) : (
                    <span className="avatar-initials large">{getUserInitials(selectedUser)}</span>
                  )}
                </div>
                <div className="header-info">
                  <h2>{getUserDisplayName(selectedUser)}</h2>
                  <p className="user-subtitle">
                    {selectedUser.role === 'tailor' && selectedUser.tailorProfile?.yearsOfExperience
                      ? `${selectedUser.tailorProfile.yearsOfExperience} Years Experience`
                      : selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)
                    }
                  </p>
                </div>
              </div>

              <div className="details-content">
                {selectedUser.role === 'tailor' && selectedUser.tailorProfile && (
                  <>
                    <div className="detail-section">
                      <h4>Specialties</h4>
                      <div className="tags-list">
                        {selectedUser.tailorProfile.specialties?.length > 0 ? (
                          selectedUser.tailorProfile.specialties.map((specialty, idx) => (
                            <span key={idx} className="tag">{specialty}</span>
                          ))
                        ) : (
                          <span className="no-data">No specialties listed</span>
                        )}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Services</h4>
                      <div className="tags-list">
                        {selectedUser.tailorProfile.services?.length > 0 ? (
                          selectedUser.tailorProfile.services.slice(0, 5).map((service, idx) => (
                            <span key={idx} className="tag secondary">{service.name}</span>
                          ))
                        ) : (
                          <span className="no-data">No services listed</span>
                        )}
                      </div>
                    </div>

                    {selectedUser.tailorProfile.rating > 0 && (
                      <div className="detail-row">
                        <FiStar className="detail-icon" />
                        <div>
                          <span className="detail-label">Rating</span>
                          <span className="detail-value">{selectedUser.tailorProfile.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="detail-row">
                  <FiPhone className="detail-icon" />
                  <div>
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <FiMail className="detail-icon" />
                  <div>
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <FiMapPin className="detail-icon" />
                  <div>
                    <span className="detail-label">Location</span>
                    <span className="detail-value">
                      {selectedUser.location?.city && selectedUser.location?.country
                        ? `${selectedUser.location.city}, ${selectedUser.location.country}`
                        : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="detail-row">
                  <FiCalendar className="detail-icon" />
                  <div>
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">{formatJoinDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <FiUser />
              <h3>Select a User</h3>
              <p>Choose someone from the list to view their details</p>
            </div>
          )}
        </div>

        {/* Right Panel - Chat Window */}
        <div className="chat-window-panel">
          {selectedUser ? (
            <>
              <div className="chat-window-header">
                <h2>Conversation</h2>
                <button className="new-message-btn">
                  <FiPlus /> New Message
                </button>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <FiMessageCircle />
                    <p>No messages yet</p>
                    <span>Start the conversation by sending a message below</span>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const showDate = index === 0 ||
                        formatMessageDate(msg.createdAt) !== formatMessageDate(messages[index - 1].createdAt);
                      const isAdmin = msg.sender?._id === 'admin' || msg.sender?.role === 'admin';

                      return (
                        <div key={msg._id || index}>
                          {showDate && (
                            <div className="date-divider">
                              <span>{formatMessageDate(msg.createdAt)}</span>
                            </div>
                          )}
                          <div className={`message-row ${isAdmin ? 'sent' : 'received'}`}>
                            {!isAdmin && (
                              <div className="message-avatar">
                                {selectedUser.profileImage ? (
                                  <img src={selectedUser.profileImage} alt="" />
                                ) : (
                                  <span>{getUserInitials(selectedUser)}</span>
                                )}
                              </div>
                            )}
                            <div className="message-bubble">
                              <p>{msg.content}</p>
                              <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim() || sendingMessage}>
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <FiMessageCircle />
              <h3>No Conversation Selected</h3>
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
