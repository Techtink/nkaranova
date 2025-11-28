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
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const STATUS_LABELS = {
  pending: 'Pending Approval',
  confirmed: 'Consultation Scheduled',
  consultation_done: 'Awaiting Quote',
  quote_submitted: 'Quote Received',
  quote_accepted: 'Quote Accepted',
  paid: 'Paid - Order Created',
  converted: 'Order In Progress',
  cancelled: 'Cancelled',
  declined: 'Declined'
};

const STATUS_DESCRIPTIONS = {
  pending: 'Waiting for tailor to accept your booking request',
  confirmed: 'Your consultation is scheduled. Please attend on the scheduled date.',
  consultation_done: 'Consultation complete. Tailor is preparing your quote.',
  quote_submitted: 'Review the quote and accept to proceed with payment.',
  quote_accepted: 'Quote accepted! Please proceed to payment.',
  paid: 'Payment received. Your order has been created.',
  converted: 'Your order is being worked on.',
  cancelled: 'This booking was cancelled.',
  declined: 'This booking was declined by the tailor.'
};

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

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

  const openQuoteModal = (booking) => {
    setSelectedBooking(booking);
    setShowQuoteModal(true);
  };

  const handleAcceptQuote = async () => {
    if (!selectedBooking) return;

    setProcessingAction(true);
    try {
      await bookingsAPI.acceptQuote(selectedBooking._id);
      setShowQuoteModal(false);
      loadBookings();
      Alert.alert('Success', 'Quote accepted! Please proceed to payment.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept quote');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectQuote = () => {
    Alert.prompt(
      'Reject Quote',
      'Please provide a reason for rejecting the quote:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            setProcessingAction(true);
            try {
              await bookingsAPI.rejectQuote(selectedBooking._id, reason || 'Customer rejected quote');
              setShowQuoteModal(false);
              loadBookings();
              Alert.alert('Quote Rejected', 'The booking has been cancelled.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject quote');
            } finally {
              setProcessingAction(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handlePayment = async (booking) => {
    // Navigate to payment screen or handle payment
    navigation.navigate('Payment', { bookingId: booking._id, amount: booking.quote?.totalAmount });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.info;
      case 'consultation_done': return '#9b59b6'; // Purple
      case 'quote_submitted': return '#e67e22'; // Orange
      case 'quote_accepted': return '#1abc9c'; // Teal
      case 'paid': return colors.success;
      case 'converted': return colors.success;
      case 'cancelled': return colors.error;
      case 'declined': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'calendar-outline';
      case 'consultation_done': return 'document-text-outline';
      case 'quote_submitted': return 'pricetag-outline';
      case 'quote_accepted': return 'checkmark-circle-outline';
      case 'paid': return 'card-outline';
      case 'converted': return 'construct-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'declined': return 'close-circle-outline';
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
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
    const hasQuote = booking.status === 'quote_submitted' && booking.quote;
    const needsPayment = booking.status === 'quote_accepted' && booking.quote;

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
            <Text style={styles.serviceType} numberOfLines={1}>{booking.service}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              <Ionicons
                name={getStatusIcon(booking.status)}
                size={12}
                color={getStatusColor(booking.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {STATUS_LABELS[booking.status] || booking.status}
              </Text>
            </View>
          </View>

          <View style={styles.tailorRow}>
            <Image
              source={{ uri: booking.tailor?.profilePhoto || 'https://via.placeholder.com/32' }}
              style={styles.tailorAvatar}
            />
            <Text style={styles.tailorName}>{booking.tailor?.businessName || 'Tailor'}</Text>
          </View>

          <Text style={styles.statusDescription}>
            {STATUS_DESCRIPTIONS[booking.status]}
          </Text>

          {booking.quote?.totalAmount && (
            <View style={styles.quoteRow}>
              <Ionicons name="pricetag" size={14} color={colors.primary} />
              <Text style={styles.quoteAmount}>
                Quote: {formatCurrency(booking.quote.totalAmount)}
              </Text>
            </View>
          )}

          <View style={styles.cardActions}>
            {hasQuote && (
              <TouchableOpacity
                style={styles.viewQuoteButton}
                onPress={() => openQuoteModal(booking)}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.white} />
                <Text style={styles.viewQuoteText}>View Quote</Text>
              </TouchableOpacity>
            )}

            {needsPayment && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handlePayment(booking)}
              >
                <Ionicons name="card-outline" size={16} color={colors.white} />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(booking._id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {booking.status === 'converted' && booking.order && (
              <TouchableOpacity
                style={styles.viewOrderButton}
                onPress={() => navigation.navigate('OrderDetail', { orderId: booking.order })}
              >
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.viewOrderText}>View Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const QuoteModal = () => {
    if (!selectedBooking?.quote) return null;
    const quote = selectedBooking.quote;

    return (
      <Modal
        visible={showQuoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quote Details</Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.quoteSection}>
                <Text style={styles.sectionTitle}>Service</Text>
                <Text style={styles.sectionValue}>{selectedBooking.service}</Text>
              </View>

              <View style={styles.quoteSection}>
                <Text style={styles.sectionTitle}>Tailor</Text>
                <Text style={styles.sectionValue}>{selectedBooking.tailor?.businessName}</Text>
              </View>

              {quote.items?.length > 0 && (
                <View style={styles.quoteSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {quote.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemDescription}>
                        {item.description} x{item.quantity}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.costBreakdown}>
                {quote.laborCost > 0 && (
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Labor</Text>
                    <Text style={styles.costValue}>{formatCurrency(quote.laborCost)}</Text>
                  </View>
                )}
                {quote.materialCost > 0 && (
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Materials</Text>
                    <Text style={styles.costValue}>{formatCurrency(quote.materialCost)}</Text>
                  </View>
                )}
                <View style={[styles.costRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(quote.totalAmount)}</Text>
                </View>
              </View>

              {quote.estimatedDays && (
                <View style={styles.quoteSection}>
                  <Text style={styles.sectionTitle}>Estimated Timeline</Text>
                  <View style={styles.timelineContainer}>
                    <View style={styles.timelineItem}>
                      <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                      <Text style={styles.timelineLabel}>Design</Text>
                      <Text style={styles.timelineDays}>{quote.estimatedDays.design} days</Text>
                    </View>
                    <View style={styles.timelineArrow}>
                      <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                    </View>
                    <View style={styles.timelineItem}>
                      <Ionicons name="cut-outline" size={20} color={colors.primary} />
                      <Text style={styles.timelineLabel}>Sewing</Text>
                      <Text style={styles.timelineDays}>{quote.estimatedDays.sew} days</Text>
                    </View>
                    <View style={styles.timelineArrow}>
                      <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                    </View>
                    <View style={styles.timelineItem}>
                      <Ionicons name="car-outline" size={20} color={colors.primary} />
                      <Text style={styles.timelineLabel}>Delivery</Text>
                      <Text style={styles.timelineDays}>{quote.estimatedDays.deliver} days</Text>
                    </View>
                  </View>
                  <Text style={styles.totalDays}>
                    Total: ~{(quote.estimatedDays.design || 0) + (quote.estimatedDays.sew || 0) + (quote.estimatedDays.deliver || 0)} days
                  </Text>
                </View>
              )}

              {quote.notes && (
                <View style={styles.quoteSection}>
                  <Text style={styles.sectionTitle}>Notes from Tailor</Text>
                  <Text style={styles.notesText}>{quote.notes}</Text>
                </View>
              )}
            </ScrollView>

            {selectedBooking.status === 'quote_submitted' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleRejectQuote}
                  disabled={processingAction}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleAcceptQuote}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={colors.white} />
                      <Text style={styles.acceptButtonText}>Accept Quote</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <FilterButton value="all" label="All" />
        <FilterButton value="pending" label="Pending" />
        <FilterButton value="confirmed" label="Scheduled" />
        <FilterButton value="quote_submitted" label="Quotes" />
        <FilterButton value="quote_accepted" label="To Pay" />
        <FilterButton value="converted" label="Active" />
      </ScrollView>

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
                : `No ${STATUS_LABELS[filter] || filter} bookings`}
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

      <QuoteModal />
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
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexGrow: 0
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    marginRight: spacing.sm
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
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  serviceType: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm
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
    fontWeight: '600'
  },
  tailorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
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
  statusDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic'
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md
  },
  quoteAmount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap'
  },
  viewQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs
  },
  viewQuoteText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600'
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs
  },
  payButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600'
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    color: colors.error
  },
  viewOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs
  },
  viewOrderText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600'
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  modalBody: {
    padding: spacing.md
  },
  quoteSection: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  sectionValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  itemDescription: {
    fontSize: fontSize.base,
    color: colors.textPrimary
  },
  itemPrice: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  costBreakdown: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  costLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary
  },
  costValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: 0
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1
  },
  timelineLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  timelineDays: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary
  },
  timelineArrow: {
    paddingHorizontal: spacing.xs
  },
  totalDays: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm
  },
  notesText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  rejectButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.error
  },
  rejectButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.error
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    gap: spacing.xs
  },
  acceptButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.white
  }
});
