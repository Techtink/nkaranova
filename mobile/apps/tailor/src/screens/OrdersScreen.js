import { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
  Platform
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
  const [workPlanModal, setWorkPlanModal] = useState({ visible: false, order: null });
  const [stages, setStages] = useState([{ name: '', description: '', estimatedDays: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await ordersAPI.getTailorOrders(params);
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

  const openWorkPlanModal = (order) => {
    setWorkPlanModal({ visible: true, order });
    setStages([{ name: '', description: '', estimatedDays: 1 }]);
  };

  const addStage = () => {
    setStages([...stages, { name: '', description: '', estimatedDays: 1 }]);
  };

  const removeStage = (index) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index][field] = value;
    setStages(newStages);
  };

  const submitWorkPlan = async () => {
    const validStages = stages.filter(s => s.name.trim());
    if (validStages.length === 0) {
      Alert.alert('Error', 'Please add at least one stage');
      return;
    }

    setSubmitting(true);
    try {
      await ordersAPI.submitWorkPlan(workPlanModal.order._id, { stages: validStages });
      Alert.alert('Success', 'Work plan submitted successfully');
      setWorkPlanModal({ visible: false, order: null });
      loadOrders();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit work plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteStage = async (orderId, stageIndex) => {
    Alert.alert(
      'Complete Stage',
      'Mark this stage as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await ordersAPI.completeStage(orderId, stageIndex, {});
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete stage');
            }
          }
        }
      ]
    );
  };

  const handleMarkOrderComplete = async (orderId) => {
    Alert.alert(
      'Complete Order',
      'Mark this order as completed? The customer will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await ordersAPI.markComplete(orderId);
              Alert.alert('Success', 'Order marked as completed');
              loadOrders();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete order');
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
      case 'awaiting_plan': return 'Needs Plan';
      case 'plan_review': return 'Plan Review';
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

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : order._id)}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.customerName}>{order.customer?.name}</Text>
            <Text style={styles.serviceType}>{order.serviceType}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {order.status === 'in_progress' && order.workPlan && (
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

            {/* Work Plan Stages */}
            {order.workPlan?.stages?.length > 0 && (
              <View style={styles.stagesContainer}>
                <Text style={styles.sectionTitle}>Work Plan</Text>
                {order.workPlan.stages.map((stage, index) => (
                  <View key={index} style={styles.stageItem}>
                    <View style={[
                      styles.stageIndicator,
                      stage.status === 'completed' && styles.stageCompleted,
                      stage.status === 'in_progress' && styles.stageInProgress
                    ]}>
                      {stage.status === 'completed' ? (
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      ) : stage.status === 'in_progress' ? (
                        <View style={styles.pulseDot} />
                      ) : (
                        <Text style={styles.stageNumber}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.stageInfo}>
                      <Text style={styles.stageName}>{stage.name}</Text>
                      <Text style={styles.stageDays}>{stage.estimatedDays} days</Text>
                    </View>
                    {stage.status === 'in_progress' && order.status === 'in_progress' && (
                      <TouchableOpacity
                        style={styles.completeStageBtn}
                        onPress={() => handleCompleteStage(order._id, index)}
                      >
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              {order.status === 'awaiting_plan' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => openWorkPlanModal(order)}
                >
                  <Ionicons name="create-outline" size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Create Work Plan</Text>
                </TouchableOpacity>
              )}
              {order.status === 'ready' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.successButton]}
                  onPress={() => handleMarkOrderComplete(order._id)}
                >
                  <Ionicons name="checkmark-done" size={16} color={colors.white} />
                  <Text style={styles.actionButtonText}>Mark Completed</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => navigation.navigate('Chat', { customerId: order.customer?._id })}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Work Plan Modal
  const WorkPlanModal = () => {
    const totalDays = stages.reduce((sum, s) => sum + (parseInt(s.estimatedDays) || 0), 0);

    return (
      <Modal
        visible={workPlanModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Work Plan</Text>
            <TouchableOpacity onPress={() => setWorkPlanModal({ visible: false, order: null })}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {workPlanModal.order && (
              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Order Details</Text>
                <Text style={styles.summaryText}>
                  Customer: {workPlanModal.order.customer?.name}
                </Text>
                <Text style={styles.summaryText}>
                  Service: {workPlanModal.order.serviceType}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Work Stages</Text>
            <Text style={styles.sectionHelp}>
              Break down the work into stages. Each stage should have a clear deliverable.
            </Text>

            {stages.map((stage, index) => (
              <View key={index} style={styles.stageInputGroup}>
                <View style={styles.stageNumberBadge}>
                  <Text style={styles.stageNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stageInputs}>
                  <TextInput
                    style={styles.input}
                    placeholder="Stage name (e.g., Fabric Selection)"
                    value={stage.name}
                    onChangeText={(text) => updateStage(index, 'name', text)}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    value={stage.description}
                    onChangeText={(text) => updateStage(index, 'description', text)}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.daysInputRow}>
                    <Text style={styles.daysLabel}>Estimated days:</Text>
                    <TextInput
                      style={styles.daysInput}
                      keyboardType="number-pad"
                      value={String(stage.estimatedDays)}
                      onChangeText={(text) => updateStage(index, 'estimatedDays', parseInt(text) || 1)}
                    />
                  </View>
                </View>
                {stages.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeStageBtn}
                    onPress={() => removeStage(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addStageBtn} onPress={addStage}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.addStageText}>Add Stage</Text>
            </TouchableOpacity>

            <View style={styles.planSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Stages</Text>
                <Text style={styles.summaryValue}>{stages.filter(s => s.name.trim()).length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Estimated Days</Text>
                <Text style={styles.summaryValue}>{totalDays}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setWorkPlanModal({ visible: false, order: null })}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, submitting && styles.disabledButton]}
              onPress={submitWorkPlan}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Submit Plan</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

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
        <FilterButton value="awaiting_plan" label="Needs Plan" />
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

      <WorkPlanModal />
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
  customerName: {
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  stagesContainer: {
    marginTop: spacing.sm
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs
  },
  stageIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stageCompleted: {
    backgroundColor: colors.success
  },
  stageInProgress: {
    backgroundColor: colors.primary
  },
  stageNumber: {
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
  stageInfo: {
    flex: 1,
    marginLeft: spacing.sm
  },
  stageName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary
  },
  stageDays: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  completeStageBtn: {
    padding: spacing.xs
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
  successButton: {
    backgroundColor: colors.success
  },
  secondaryButton: {
    flex: 0,
    width: 44,
    backgroundColor: colors.bgSecondary
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
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  orderSummary: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  sectionHelp: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md
  },
  stageInputGroup: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md
  },
  stageNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  stageNumberText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white
  },
  stageInputs: {
    flex: 1
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top'
  },
  daysInputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  daysLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm
  },
  daysInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    width: 60,
    textAlign: 'center'
  },
  removeStageBtn: {
    padding: spacing.sm
  },
  addStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg
  },
  addStageText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.xs
  },
  planSummary: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xl
  },
  summaryItem: {},
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary
  }
});
