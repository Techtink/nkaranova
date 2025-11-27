import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { conversationsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationsAPI.getAll();
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const ConversationCard = ({ conversation }) => {
    const otherParticipant = conversation.participants?.find(
      (p) => p.role === 'tailor'
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chat', { conversationId: conversation._id })}
      >
        <Image
          source={{ uri: otherParticipant?.profilePhoto || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {otherParticipant?.name || 'Unknown'}
            </Text>
            <Text style={styles.time}>
              {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
            </Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              conversation.unreadCount > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {conversation.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ConversationCard conversation={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Start a conversation with a tailor to see your messages here
            </Text>
          </View>
        }
      />
    </View>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28
  },
  unreadBadge: {
    position: 'absolute',
    top: spacing.md,
    left: 56,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    marginLeft: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm
  }
});
