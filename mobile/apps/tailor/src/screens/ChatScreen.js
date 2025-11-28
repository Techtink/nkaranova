import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { conversationsAPI } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

const API_URL = 'http://localhost:5001/api';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, orderContext, recipientId, recipientName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  // Format date for display
  const formatOrderDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  useEffect(() => {
    // Set navigation header with order context if available
    if (orderContext) {
      const acceptedDate = formatOrderDate(orderContext.acceptedAt);
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
              {orderContext.orderNumber}
            </Text>
            {acceptedDate && (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Accepted {acceptedDate}
              </Text>
            )}
          </View>
        )
      });
    }

    loadConversation();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [conversationId, recipientId]);

  const setupSocket = (convId) => {
    if (!convId || socketRef.current) return;

    const socketUrl = API_URL.replace('/api', '');

    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join:conversation', convId);
    });

    socketRef.current.on('new:message', (data) => {
      if (data.conversationId === convId) {
        setMessages(prev => [...prev, data.message]);
      }
    });
  };

  const loadConversation = async () => {
    try {
      let convId = conversationId;
      let convData = null;

      // If no conversationId but we have recipientId, start/get conversation first
      if (!convId && recipientId) {
        const startRes = await conversationsAPI.startWithUser(recipientId);
        convData = startRes.data.data;
        convId = convData._id;
        setActiveConversationId(convId);
        setConversation(convData);
      }

      if (!convId) {
        console.error('No conversation ID available');
        setLoading(false);
        return;
      }

      // Load conversation details if not already loaded
      if (!convData) {
        const convRes = await conversationsAPI.getById(convId);
        convData = convRes.data.data;
        setConversation(convData);
      }

      // Load messages
      const messagesRes = await conversationsAPI.getMessages(convId);
      setMessages(messagesRes.data.data);

      await conversationsAPI.markAsRead(convId);

      // Set header title if no order context (order context is set in useEffect)
      if (!orderContext) {
        const otherParticipant = convData.participants?.find(
          p => p._id !== user?._id
        );
        navigation.setOptions({
          title: otherParticipant?.firstName
            ? `${otherParticipant.firstName} ${otherParticipant.lastName || ''}`
            : recipientName || 'Chat'
        });
      }

      // Setup socket after we have a valid conversation ID
      setupSocket(convId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const convId = activeConversationId || conversationId;
    if (!newMessage.trim() || sending || !convId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempMessage = {
      _id: Date.now().toString(),
      content: messageContent,
      sender: user,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await conversationsAPI.sendMessage(convId, { content: messageContent });
      setMessages(prev =>
        prev.map(m => m._id === tempMessage._id ? { ...m, pending: false } : m)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = item.sender?._id === user?._id || item.sender === user?._id;
    const showDate = shouldShowDate(item, messages[index - 1]);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
          {!isOwn && (
            <Image
              source={{ uri: item.sender?.profilePhoto || 'https://via.placeholder.com/32' }}
              style={styles.senderAvatar}
            />
          )}
          <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
              {item.pending && (
                <Ionicons name="time-outline" size={12} color={colors.white} style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? colors.white : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: spacing.md
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end'
  },
  ownMessageRow: {
    justifyContent: 'flex-end'
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.xs
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: spacing.xs
  },
  messageText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 20
  },
  ownMessageText: {
    color: colors.white
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 2
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    maxHeight: 100
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgTertiary
  }
});
