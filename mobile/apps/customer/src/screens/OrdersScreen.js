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
import { ordersAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ visible: false, orderId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await ordersAPI.getCustomerOrders(params);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleApproveWorkPlan = async (orderId) => {
    Alert.alert(
      'Approve Work Plan',
      'Are you sure you want to approve this work plan? The tailor will begin working on your order.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await ordersAPI.approveWorkPlan(orderId);
              Alert.alert('Success', 'Work plan approved. The tailor will now begin working on your order.');
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve work plan');
            }
          }
        }
      ]
    );
  };

  const handleRejectWorkPlan = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await ordersAPI.rejectWorkPlan(rejectModal.orderId, { reason: rejectReason });
      Alert.alert('Success', 'Work plan rejected. The tailor will revise and resubmit.');
      setRejectModal({ visible: false, orderId: null });
      setRejectReason('');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject work plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelayResponse = async (orderId, approved) => {
    Alert.alert(
      approved ? 'Approve Delay' : 'Reject Delay',
      approved
        ? 'Are you sure you want to approve this delay request?'
        : 'Are you sure you want to reject this delay request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approved ? 'Approve' : 'Reject',
          onPress: async () => {
            try {
              await ordersAPI.respondToDelay(orderId, { approved });
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to respond to delay request');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'awaiting_plan': return colors.warning;
      case 'plan_review': return colors.info;
      case 'in_progress': return colors.primary;
      case 'ready': return colors.success;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'awaiting_plan': return 'Awaiting Plan';
      case 'plan_review': return 'Review Plan';
      case 'in_progress': return 'In Progress';
      case 'ready': return 'Ready';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (workPlan) => {
    if (!workPlan?.stages?.length) return 0;
    const completed = workPlan.stages.filter(s => s.status === 'completed').length;
    return Math.round((completed / workPlan.stages.length) * 100);
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

  const OrderCard = ({ order }) => {
    const isExpanded = expandedId === order._id;
    const progress = calculateProgress(order.workPlan);
    const hasPendingDelay = order.delayRequests?.some(d => d.status === 'pending');

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : order._id)}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.tailorName}>{order.tailor?.businessName || order.tailor?.name}</Text>
            <Text style={styles.serviceType}>{order.serviceType}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            {hasPendingDelay && (
              <View style={styles.delayBadge}>
                <Ionicons name="time" size={12} color={colors.warning} />
              </View>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {(order.status === 'in_progress' || order.status === 'ready') && order.workPlan && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>Created: {formatDate(order.createdAt)}</Text>
            </View>
            {order.workPlan?.estimatedCompletionDate && (
              <View style={styles.infoRow}>
                <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>
                  Est. Completion: {formatDate(order.workPlan.estimatedCompletionDate)}
                </Text>
              </View>
            )}

            {/* Pending Delay Request */}
            {hasPendingDelay && (
              <View style={styles.delayRequestCard}>
                <View style={styles.delayHeader}>
                  <Ionicons name="time" size={18} color={colors.warning} />
                  <Text style={styles.delayTitle}>Delay Request</Text>
                </View>
                {order.delayRequests
                  .filter(d => d.status === 'pending')
                  .map((delay, idx) => (
                    <View key={idx}>
                      <Text style={styles.delayReason}>{delay.reason}</Text>
                      <Text style={styles.delayDays}>
                        Requesting {delay.additionalDays} additional days
                      </Text>
                      <View style={styles.delayActions}>
                        <TouchableOpacity
                          style={[styles.delayBtn, styles.approveBtn]}
                          onPress={() => handleDelayResponse(order._id, true)}
                        >
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.delayBtn, styles.rejectBtn]}
                          onPress={() => handleDelayResponse(order._id, false)}
                        >
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Progress Timeline */}
            {order.workPlan?.stages?.length > 0 && (
              <View style={styles.timelineContainer}>
                <Text style={styles.sectionTitle}>Progress</Text>
                {order.workPlan.stages.map((stage, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineMarker,
                        stage.status === 'completed' && styles.markerCompleted,
                        stage.status === 'in_progress' && styles.markerInProgress
                      ]}>
                        {stage.status === 'completed' ? (
                          <Ionicons name="checkmark" size={12} color={colors.white} />
                        ) : stage.status === 'in_progress' ? (
                          <View style={styles.pulseDot} />
                        ) : (
                          <Text style={styles.markerNumber}>{index + 1}</Text>
                        )}
                      </View>
                      {index < order.workPlan.stages.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          stage.status === 'completed' && styles.lineCompleted
                        ]} />
                      )}
                    </View>
                    <View style={[
                      styles.timelineContent,
                      stage.status === 'pending' && styles.contentPending
                    ]}>
                      <Text style={styles.stageName}>{stage.name}</Text>
                      {stage.description && (
                        <Text style={styles.stageDescription}>{stage.description}</Text>
                      )}
                      <View style={styles.stageMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.stageMetaText}>
                          {stage.status === 'completed'
                            ? `Completed ${formatDate(stage.completedAt)}`
                            : `${stage.estimatedDays} days estimated`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              {order.status === 'plan_review' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleApproveWorkPlan(order._id)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                    <Text style={styles.actionButtonText}>Approve Plan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectPlanBtn]}
                    onPress={() => setRejectModal({ visible: true, orderId: order._id })}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                    <Text style={styles.rejectPlanBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => navigation.navigate('Chat', { tailorId: order.tailor?._id })}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Reject Modal
  const RejectModal = () => (
    <Modal
      visible={rejectModal.visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reject Work Plan</Text>
          <TouchableOpacity onPress={() => {
            setRejectModal({ visible: false, orderId: null });
            setRejectReason('');
          }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>
            Please provide feedback so the tailor can revise the work plan.
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="What changes would you like to see?"
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setRejectModal({ visible: false, orderId: null });
              setRejectReason('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.errorButton, submitting && styles.disabledButton]}
            onPress={handleRejectWorkPlan}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && !orders.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton value="all" label="All" />
        <FilterButton value="awaiting_plan" label="Awaiting Plan" />
        <FilterButton value="plan_review" label="Review" />
        <FilterButton value="in_progress" label="In Progress" />
        <FilterButton value="ready" label="Ready" />
        <FilterButton value="completed" label="Completed" />
      </ScrollView>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You don't have any orders yet"
                : `No ${getStatusLabel(filter).toLowerCase()} orders`}
            </Text>
          </View>
        }
      />

      <RejectModal />
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
    maxHeight: 56
  },
  filterContent: {
    padding: spacing.sm,
    gap: spacing.sm
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
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  tailorName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  serviceType: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2
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
  delayBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
    minWidth: 36
  },
  cardBody: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
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
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  delayRequestCard: {
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '30',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md
  },
  delayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  delayTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.warning
  },
  delayReason: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  delayDays: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm
  },
  delayActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  delayBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  approveBtn: {
    backgroundColor: colors.success
  },
  rejectBtn: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.error
  },
  approveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white
  },
  rejectBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.error
  },
  timelineContainer: {
    marginTop: spacing.md
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32
  },
  timelineMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  markerCompleted: {
    backgroundColor: colors.success
  },
  markerInProgress: {
    backgroundColor: colors.primary
  },
  markerNumber: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.bgTertiary,
    marginVertical: spacing.xs
  },
  lineCompleted: {
    backgroundColor: colors.success
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.sm
  },
  contentPending: {
    opacity: 0.6
  },
  stageName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary
  },
  stageDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  stageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs
  },
  stageMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  errorButton: {
    backgroundColor: colors.error
  },
  secondaryButton: {
    flex: 0,
    width: 44,
    backgroundColor: colors.bgSecondary
  },
  rejectPlanBtn: {
    flex: 0,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing.md
  },
  rejectPlanBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.error
  },
  cancelButton: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  disabledButton: {
    opacity: 0.6
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white
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
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary
  },
  modalBody: {
    flex: 1,
    padding: spacing.md
  },
  modalHelp: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md
  },
  textArea: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    minHeight: 120
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  }
});
