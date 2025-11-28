import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  consultation_done: 'Needs Quote',
  quote_submitted: 'Quote Sent',
  quote_accepted: 'Quote Accepted',
  paid: 'Paid',
  converted: 'Converted',
  cancelled: 'Cancelled',
  declined: 'Declined'
};

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [quoteData, setQuoteData] = useState({
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    laborCost: 0,
    materialCost: 0,
    notes: '',
    estimatedDays: { design: 3, sew: 7, deliver: 2 }
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

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

  const handleConfirmBooking = (bookingId) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await bookingsAPI.confirm(bookingId);
              loadBookings();
              Alert.alert('Success', 'Booking confirmed. Please wait for admin to mark consultation complete.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm booking');
            }
          }
        }
      ]
    );
  };

  const handleDeclineBooking = (bookingId) => {
    Alert.prompt(
      'Decline Booking',
      'Please provide a reason for declining:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await bookingsAPI.cancel(bookingId, reason || 'Declined by tailor');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline booking');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const openQuoteModal = (booking) => {
    setSelectedBooking(booking);
    setQuoteData({
      items: [{ description: booking.service || '', quantity: 1, unitPrice: 0 }],
      laborCost: 0,
      materialCost: 0,
      notes: '',
      estimatedDays: { design: 3, sew: 7, deliver: 2 }
    });
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedBooking) return;

    // Validate quote
    const totalItems = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalAmount = totalItems + quoteData.laborCost + quoteData.materialCost;

    if (totalAmount <= 0) {
      Alert.alert('Error', 'Please enter valid pricing for the quote');
      return;
    }

    setSubmittingQuote(true);
    try {
      await bookingsAPI.submitQuote(selectedBooking._id, {
        ...quoteData,
        totalAmount
      });
      setShowQuoteModal(false);
      loadBookings();
      Alert.alert('Success', 'Quote submitted successfully. Customer will be notified.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const updateQuoteItem = (index, field, value) => {
    const newItems = [...quoteData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteData({ ...quoteData, items: newItems });
  };

  const addQuoteItem = () => {
    setQuoteData({
      ...quoteData,
      items: [...quoteData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeQuoteItem = (index) => {
    if (quoteData.items.length > 1) {
      const newItems = quoteData.items.filter((_, i) => i !== index);
      setQuoteData({ ...quoteData, items: newItems });
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || '';
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
    const customerName = booking.customer?.firstName
      ? `${booking.customer.firstName} ${booking.customer.lastName || ''}`
      : 'Customer';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{customerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {STATUS_LABELS[booking.status] || booking.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {formatDate(booking.date)} at {formatTime(booking.startTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cut-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>{booking.service}</Text>
          </View>
          {booking.quote?.totalAmount && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Quote: {formatCurrency(booking.quote.totalAmount)}
              </Text>
            </View>
          )}
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
                onPress={() => handleConfirmBooking(booking._id)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleDeclineBooking(booking._id)}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {booking.status === 'consultation_done' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.quoteButton]}
              onPress={() => openQuoteModal(booking)}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.white} />
              <Text style={styles.actionButtonText}> Submit Quote</Text>
            </TouchableOpacity>
          )}
          {booking.status === 'confirmed' && (
            <View style={styles.waitingMessage}>
              <Ionicons name="time-outline" size={16} color={colors.info} />
              <Text style={styles.waitingText}>Waiting for consultation</Text>
            </View>
          )}
          {(booking.status === 'quote_submitted' || booking.status === 'quote_accepted') && (
            <View style={styles.waitingMessage}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={styles.waitingText}>Awaiting customer response</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const QuoteModal = () => (
    <Modal
      visible={showQuoteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowQuoteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Quote</Text>
            <TouchableOpacity onPress={() => setShowQuoteModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Items</Text>
            {quoteData.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.itemDescription]}
                  placeholder="Description"
                  value={item.description}
                  onChangeText={(text) => updateQuoteItem(index, 'description', text)}
                />
                <TextInput
                  style={[styles.input, styles.itemQty]}
                  placeholder="Qty"
                  keyboardType="numeric"
                  value={item.quantity.toString()}
                  onChangeText={(text) => updateQuoteItem(index, 'quantity', parseInt(text) || 1)}
                />
                <TextInput
                  style={[styles.input, styles.itemPrice]}
                  placeholder="Price"
                  keyboardType="numeric"
                  value={item.unitPrice.toString()}
                  onChangeText={(text) => updateQuoteItem(index, 'unitPrice', parseFloat(text) || 0)}
                />
                {quoteData.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeQuoteItem(index)}>
                    <Ionicons name="remove-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addItemButton} onPress={addQuoteItem}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Additional Costs</Text>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Labor Cost</Text>
              <TextInput
                style={[styles.input, styles.costInput]}
                placeholder="0"
                keyboardType="numeric"
                value={quoteData.laborCost.toString()}
                onChangeText={(text) => setQuoteData({ ...quoteData, laborCost: parseFloat(text) || 0 })}
              />
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Material Cost</Text>
              <TextInput
                style={[styles.input, styles.costInput]}
                placeholder="0"
                keyboardType="numeric"
                value={quoteData.materialCost.toString()}
                onChangeText={(text) => setQuoteData({ ...quoteData, materialCost: parseFloat(text) || 0 })}
              />
            </View>

            <Text style={styles.sectionTitle}>Estimated Timeline (days)</Text>
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Design</Text>
                <TextInput
                  style={[styles.input, styles.timelineInput]}
                  keyboardType="numeric"
                  value={quoteData.estimatedDays.design.toString()}
                  onChangeText={(text) => setQuoteData({
                    ...quoteData,
                    estimatedDays: { ...quoteData.estimatedDays, design: parseInt(text) || 1 }
                  })}
                />
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Sew</Text>
                <TextInput
                  style={[styles.input, styles.timelineInput]}
                  keyboardType="numeric"
                  value={quoteData.estimatedDays.sew.toString()}
                  onChangeText={(text) => setQuoteData({
                    ...quoteData,
                    estimatedDays: { ...quoteData.estimatedDays, sew: parseInt(text) || 1 }
                  })}
                />
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Deliver</Text>
                <TextInput
                  style={[styles.input, styles.timelineInput]}
                  keyboardType="numeric"
                  value={quoteData.estimatedDays.deliver.toString()}
                  onChangeText={(text) => setQuoteData({
                    ...quoteData,
                    estimatedDays: { ...quoteData.estimatedDays, deliver: parseInt(text) || 1 }
                  })}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Additional notes for the customer..."
              multiline
              numberOfLines={3}
              value={quoteData.notes}
              onChangeText={(text) => setQuoteData({ ...quoteData, notes: text })}
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(
                  quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) +
                  quoteData.laborCost +
                  quoteData.materialCost
                )}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setShowQuoteModal(false)}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitModalButton]}
              onPress={handleSubmitQuote}
              disabled={submittingQuote}
            >
              {submittingQuote ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitModalText}>Submit Quote</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <FilterButton value="all" label="All" />
        <FilterButton value="pending" label="Pending" />
        <FilterButton value="confirmed" label="Confirmed" />
        <FilterButton value="consultation_done" label="Needs Quote" />
        <FilterButton value="quote_submitted" label="Quote Sent" />
        <FilterButton value="paid" label="Paid" />
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
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You don't have any bookings yet"
                : `No ${STATUS_LABELS[filter] || filter} bookings`}
            </Text>
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
    fontWeight: '600'
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
    marginTop: spacing.md,
    alignItems: 'center'
  },
  actionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  confirmButton: {
    backgroundColor: colors.success
  },
  cancelButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.error
  },
  quoteButton: {
    backgroundColor: '#9b59b6'
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white
  },
  cancelButtonText: {
    color: colors.error
  },
  waitingMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm
  },
  waitingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.xs
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
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.base
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center'
  },
  itemDescription: {
    flex: 3
  },
  itemQty: {
    flex: 1
  },
  itemPrice: {
    flex: 2
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm
  },
  addItemText: {
    color: colors.primary,
    marginLeft: spacing.xs
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  costLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary
  },
  costInput: {
    width: 120
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md
  },
  timelineItem: {
    flex: 1
  },
  timelineLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  timelineInput: {
    textAlign: 'center'
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  cancelModalButton: {
    backgroundColor: colors.bgSecondary
  },
  submitModalButton: {
    backgroundColor: colors.primary
  },
  cancelModalText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary
  },
  submitModalText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.white
  }
});
