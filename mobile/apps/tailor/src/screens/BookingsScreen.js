import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingsAPI.getTailorBookings(params);
      setBookings(response.data.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleStatusUpdate = async (bookingId, status) => {
    const action = status === 'confirmed' ? 'confirm' : 'complete';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Booking`,
      `Are you sure you want to ${action} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              await bookingsAPI.updateStatus(bookingId, { status });
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to update booking status');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.info;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{booking.customer?.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cut-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>{booking.serviceType}</Text>
        </View>
        {booking.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {booking.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleStatusUpdate(booking._id, 'confirmed')}
            >
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleStatusUpdate(booking._id, 'cancelled')}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusUpdate(booking._id, 'completed')}
          >
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => navigation.navigate('Chat', { customerId: booking.customer?._id })}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !bookings.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FilterButton value="all" label="All" />
        <FilterButton value="pending" label="Pending" />
        <FilterButton value="confirmed" label="Confirmed" />
        <FilterButton value="completed" label="Completed" />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You don't have any bookings yet"
                : `No ${filter} bookings`}
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary
  },
  filterButtonActive: {
    backgroundColor: colors.primary
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600'
  },
  list: {
    padding: spacing.md
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  customerName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  cardBody: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  notesContainer: {
    marginTop: spacing.sm
  },
  notesLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmButton: {
    backgroundColor: colors.success
  },
  cancelButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.error
  },
  completeButton: {
    backgroundColor: colors.primary
  },
  messageButton: {
    flex: 0,
    width: 44,
    backgroundColor: colors.bgSecondary
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white
  },
  cancelButtonText: {
    color: colors.error
  },
  empty: {
    alignItems: 'center',
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
    marginTop: spacing.sm
  }
});
