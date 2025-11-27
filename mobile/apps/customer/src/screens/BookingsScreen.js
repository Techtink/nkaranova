import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
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
      const response = await bookingsAPI.getCustomerBookings(params);
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

  const handleCancel = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsAPI.cancel(bookingId, 'Cancelled by customer');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'completed': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
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

  const BookingCard = ({ booking }) => {
    const dateInfo = formatDate(booking.date);
    const canCancel = ['pending', 'confirmed'].includes(booking.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: booking._id })}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          <Text style={styles.dateNum}>{dateInfo.date}</Text>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.serviceType}>{booking.serviceType}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              <Ionicons
                name={getStatusIcon(booking.status)}
                size={12}
                color={getStatusColor(booking.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {booking.status}
              </Text>
            </View>
          </View>

          <View style={styles.tailorRow}>
            <Image
              source={{ uri: booking.tailor?.user?.profilePhoto || 'https://via.placeholder.com/32' }}
              style={styles.tailorAvatar}
            />
            <Text style={styles.tailorName}>{booking.tailor?.user?.name}</Text>
          </View>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.timeText}>{dateInfo.time}</Text>
          </View>

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(booking._id)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.browseButtonText}>Browse Tailors</Text>
              </TouchableOpacity>
            )}
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
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  dateBox: {
    width: 70,
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateMonth: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase'
  },
  dateNum: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white
  },
  dateDay: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)'
  },
  cardContent: {
    flex: 1,
    padding: spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  serviceType: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  tailorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm
  },
  tailorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  tailorName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.xs
  },
  cancelButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    color: colors.error
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl
  },
  browseButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
