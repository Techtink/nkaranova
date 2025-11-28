import { useState, useEffect, useRef } from 'react';
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
import { useTheme } from '../../../../shared/context/ThemeContext';
import { spacing, borderRadius, shadows } from '../../../../shared/constants/theme';

// Static design colors (non-theme dependent)
const staticColors = {
  primary: '#0088CC',
  primaryLight: '#E3F5FC',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#8B5CF6',
  infoLight: '#EDE9FE'
};

// Default theme colors (fallback)
const defaultThemeColors = {
  textPrimary: '#1A1A2E',
  textMuted: '#64748B',
  cardBg: '#FFFFFF',
  bgLight: '#F8FAFC',
  border: '#E2E8F0'
};

export default function OrdersScreen({ navigation }) {
  const { colors = defaultThemeColors } = useTheme() || {};

  // Theme-aware design colors with fallbacks
  const designColors = {
    ...staticColors,
    textDark: colors?.textPrimary || defaultThemeColors.textPrimary,
    textMuted: colors?.textMuted || defaultThemeColors.textMuted,
    cardBg: colors?.cardBg || defaultThemeColors.cardBg,
    bgLight: colors?.bgLight || defaultThemeColors.bgLight,
    border: colors?.border || defaultThemeColors.border
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [workPlanModal, setWorkPlanModal] = useState({ visible: false, order: null });
  // Fixed 4 stages - Consult is admin-controlled, tailor sets timelines for Design, Sew, Deliver
  const [fixedStages, setFixedStages] = useState({
    design: { estimatedDays: 3, notes: '' },
    sew: { estimatedDays: 7, notes: '' },
    deliver: { estimatedDays: 2, notes: '' }
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionMenu, setActionMenu] = useState({ visible: false, order: null, position: { x: 0, y: 0 } });

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

  // Work Plan Modal Functions
  const openWorkPlanModal = (order) => {
    setWorkPlanModal({ visible: true, order });
    // Reset to default timelines
    setFixedStages({
      design: { estimatedDays: 3, notes: '' },
      sew: { estimatedDays: 7, notes: '' },
      deliver: { estimatedDays: 2, notes: '' }
    });
  };

  const updateFixedStage = (stageName, field, value) => {
    setFixedStages(prev => ({
      ...prev,
      [stageName]: { ...prev[stageName], [field]: value }
    }));
  };

  const submitWorkPlan = async () => {
    // Build the fixed 4-stage work plan
    const workPlan = {
      stages: [
        { name: 'consult', displayName: 'Consultation', status: 'in_progress' },
        { name: 'design', displayName: 'Design', estimatedDays: parseInt(fixedStages.design.estimatedDays) || 3, notes: fixedStages.design.notes },
        { name: 'sew', displayName: 'Sew', estimatedDays: parseInt(fixedStages.sew.estimatedDays) || 7, notes: fixedStages.sew.notes },
        { name: 'deliver', displayName: 'Deliver', estimatedDays: parseInt(fixedStages.deliver.estimatedDays) || 2, notes: fixedStages.deliver.notes }
      ],
      currentStage: 'consult',
      totalEstimatedDays: (parseInt(fixedStages.design.estimatedDays) || 3) + (parseInt(fixedStages.sew.estimatedDays) || 7) + (parseInt(fixedStages.deliver.estimatedDays) || 2)
    };

    setSubmitting(true);
    try {
      await ordersAPI.submitWorkPlan(workPlanModal.order._id, { workPlan });
      Alert.alert('Success', 'Order accepted! Waiting for admin to complete consultation.');
      setWorkPlanModal({ visible: false, order: null });
      loadOrders();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit work plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    Alert.alert(
      'Accept Order',
      'Accept this order and create a work plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            const order = orders.find(o => o._id === orderId);
            if (order) openWorkPlanModal(order);
          }
        }
      ]
    );
  };

  const handleMarkComplete = async (orderId) => {
    Alert.alert(
      'Complete Order',
      'Mark this order as completed?',
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

  // Action menu handlers
  const openActionMenu = (order, position) => {
    setActionMenu({ visible: true, order, position: position || { x: 0, y: 0 } });
  };

  const closeActionMenu = () => {
    setActionMenu({ visible: false, order: null, position: { x: 0, y: 0 } });
  };

  const handleMessageCustomer = () => {
    const order = actionMenu.order;
    closeActionMenu();
    if (order?.customer?._id) {
      // Pass order context for chat header
      const orderContext = {
        orderId: order._id,
        orderNumber: generateOrderId(order),
        customerName: order.customer.firstName || order.customer.name || 'Customer',
        acceptedAt: order.workPlan?.acceptedAt || order.statusHistory?.find(h => h.status === 'consultation')?.changedAt,
        createdAt: order.createdAt
      };
      navigation.navigate('Chat', {
        recipientId: order.customer._id,
        recipientName: order.customer.firstName || order.customer.name || 'Customer',
        orderContext
      });
    } else {
      Alert.alert('Error', 'Unable to message customer');
    }
  };

  const handleUpdateProgress = () => {
    const order = actionMenu.order;
    closeActionMenu();
    if (order) {
      // Get current stage info
      const currentStageName = order.workPlan?.currentStage;
      const stages = order.workPlan?.stages || [];
      const currentStageIndex = stages.findIndex(s => s.name === currentStageName);
      const currentStage = stages[currentStageIndex];

      // Don't allow completing 'consult' stage - that's admin controlled
      if (currentStageName === 'consult') {
        Alert.alert('Info', 'The consultation stage is managed by admin. Please wait for admin to complete the consultation.');
        return;
      }

      if (currentStageIndex === -1 || !currentStage) {
        Alert.alert('Error', 'Unable to determine current stage');
        return;
      }

      const stageDisplayName = currentStage.displayName || currentStageName;

      Alert.alert(
        'Update Progress',
        `Mark "${stageDisplayName}" stage as complete?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Complete',
            onPress: async () => {
              try {
                await ordersAPI.completeStage(order._id, currentStageIndex, { notes: '' });
                Alert.alert('Success', `${stageDisplayName} stage marked as complete`);
                loadOrders();
              } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to update progress');
              }
            }
          }
        ]
      );
    }
  };

  const handleCompleteFromMenu = () => {
    const order = actionMenu.order;
    closeActionMenu();
    if (order) {
      // Check if all stages are completed
      const stages = order.workPlan?.stages || [];
      const allStagesComplete = stages.length > 0 && stages.every(s => s.status === 'completed');

      if (!allStagesComplete) {
        // Find incomplete stages
        const incompleteStages = stages
          .filter(s => s.status !== 'completed')
          .map(s => s.displayName || s.name)
          .join(', ');

        Alert.alert(
          'Cannot Complete Order',
          `Please complete all stages before marking the order as complete.\n\nIncomplete: ${incompleteStages || 'All stages'}`,
          [{ text: 'OK' }]
        );
        return;
      }

      handleMarkComplete(order._id);
    }
  };

  // Get status badge config - outlined for actionable, filled for status
  const getStatusConfig = (status, dc = designColors) => {
    switch (status) {
      case 'awaiting_plan':
      case 'pending':
        return { label: 'Accept', color: dc.primary, bgColor: 'transparent', outlined: true };
      case 'consultation':
        return { label: 'Consulting', color: dc.info, bgColor: dc.infoLight, outlined: false };
      case 'plan_review':
        return { label: 'Review', color: dc.info, bgColor: dc.infoLight, outlined: false };
      case 'in_progress':
        return { label: 'In Progress', color: dc.warning, bgColor: dc.warningLight, outlined: false };
      case 'ready':
        return { label: 'Ready', color: dc.success, bgColor: dc.successLight, outlined: false };
      case 'completed':
      case 'delivered':
        return { label: 'Delivered', color: dc.success, bgColor: dc.successLight, outlined: false };
      case 'cancelled':
        return { label: 'Cancelled', color: dc.error, bgColor: dc.errorLight, outlined: false };
      default:
        return { label: status, color: dc.textMuted, bgColor: '#F1F5F9', outlined: false };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // Format time from date
  const formatTimeFromDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Generate order ID
  const generateOrderId = (order) => {
    return `#HCS${order._id?.slice(-3).toUpperCase() || '000'}`;
  };

  // Filter Button Component
  const FilterButton = ({ value, label, count, designColors: dc }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: dc.bgLight },
        filter === value && styles.filterButtonActive
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterText,
        { color: dc.textMuted },
        filter === value && styles.filterTextActive
      ]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[
          styles.filterBadge,
          { backgroundColor: dc.border },
          filter === value && styles.filterBadgeActive
        ]}>
          <Text style={[
            styles.filterBadgeText,
            { color: dc.textMuted },
            filter === value && styles.filterBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Helper to format address as "City | Country"
  const formatShortAddress = (order, customer) => {
    const fullAddress = order.deliveryAddress || customer?.address || '';
    if (!fullAddress) return 'Location not set';

    // Try to extract city and country from address
    const parts = fullAddress.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const city = parts[parts.length - 2] || parts[0];
      const country = parts[parts.length - 1];
      return `${city} | ${country}`;
    }
    return fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress;
  };

  // Show full address alert
  const showFullAddress = (order, customer) => {
    const fullAddress = order.deliveryAddress || customer?.address || 'No address provided';
    Alert.alert('Delivery Address', fullAddress);
  };

  // Order Card Component - Clean design matching mockup
  const OrderCard = ({ order, designColors: dc }) => {
    const statusConfig = getStatusConfig(order.status, dc);
    const customer = order.customer;
    const isAcceptable = order.status === 'awaiting_plan' || order.status === 'pending';
    const isCompletable = order.status === 'ready';

    const handleCardPress = () => {
      if (isAcceptable) handleAcceptOrder(order._id);
      else if (isCompletable) handleMarkComplete(order._id);
    };

    return (
      <View style={[styles.orderCard, { backgroundColor: dc.cardBg, borderColor: dc.border }]}>
        {/* Clickable card body */}
        <TouchableOpacity activeOpacity={0.7} onPress={handleCardPress}>
          {/* Header Row - Name + Status Badge */}
          <View style={styles.orderHeader}>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: dc.textDark }]}>
                {customer?.firstName ? `Mr.${customer.firstName} ${customer.lastName || ''}` : customer?.name || 'Customer'}
              </Text>
              <Text style={[styles.orderId, { color: dc.textMuted }]}>{generateOrderId(order)}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
                statusConfig.outlined && styles.statusBadgeOutlined,
                statusConfig.outlined && { borderColor: statusConfig.color }
              ]}
            >
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* Date and Time Row */}
          <View style={styles.orderInfoRow}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconBg, { backgroundColor: staticColors.primaryLight }]}>
                <Ionicons name="calendar" size={14} color={staticColors.primary} />
              </View>
              <Text style={[styles.infoText, { color: dc.textDark }]}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconBg, { backgroundColor: staticColors.warningLight }]}>
                <Ionicons name="time" size={14} color={staticColors.warning} />
              </View>
              <Text style={[styles.infoText, { color: dc.textDark }]}>{formatTimeFromDate(order.createdAt)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dc.border }]} />
        </TouchableOpacity>

        {/* Address Row with Hamburger Menu - Outside main touchable */}
        <View style={styles.addressRowWithMenu}>
          <TouchableOpacity
            style={styles.addressTouchable}
            onPress={() => showFullAddress(order, customer)}
          >
            <View style={[styles.infoIconBg, { backgroundColor: staticColors.primaryLight }]}>
              <Ionicons name="location" size={14} color={staticColors.primary} />
            </View>
            <Text style={[styles.addressText, { color: dc.textMuted }]}>
              {formatShortAddress(order, customer)}
            </Text>
          </TouchableOpacity>

          {/* Hamburger Menu Icon */}
          <TouchableOpacity
            style={[styles.menuIconContainer, { backgroundColor: dc.bgLight }]}
            onPress={(event) => {
              const { pageX, pageY } = event.nativeEvent;
              openActionMenu(order, { x: pageX - 160, y: pageY + 10 });
            }}
          >
            <Ionicons name="menu" size={16} color={dc.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Decorative wave in corner */}
        <View style={styles.decorativeCorner}>
          <View style={styles.decorativeWave} />
        </View>
      </View>
    );
  };

  // Work Plan Modal Component - Fixed 4 Stages
  const WorkPlanModal = ({ designColors: dc }) => {
    const totalDays = (parseInt(fixedStages.design.estimatedDays) || 0) +
                      (parseInt(fixedStages.sew.estimatedDays) || 0) +
                      (parseInt(fixedStages.deliver.estimatedDays) || 0);

    const stageConfig = [
      { key: 'consult', name: 'Consultation', icon: 'chatbubbles-outline', color: staticColors.info, adminControlled: true },
      { key: 'design', name: 'Design', icon: 'color-palette-outline', color: staticColors.primary, adminControlled: false },
      { key: 'sew', name: 'Sew', icon: 'cut-outline', color: staticColors.warning, adminControlled: false },
      { key: 'deliver', name: 'Deliver', icon: 'cube-outline', color: staticColors.success, adminControlled: false }
    ];

    return (
      <Modal
        visible={workPlanModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: dc.cardBg }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: dc.border }]}>
            <Text style={[styles.modalTitle, { color: dc.textDark }]}>Accept Order</Text>
            <TouchableOpacity onPress={() => setWorkPlanModal({ visible: false, order: null })}>
              <Ionicons name="close" size={24} color={dc.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {workPlanModal.order && (
              <View style={[styles.orderSummary, { backgroundColor: dc.bgLight }]}>
                <Text style={[styles.summaryTitle, { color: dc.textDark }]}>Order Details</Text>
                <Text style={[styles.summaryText, { color: dc.textMuted }]}>
                  Customer: {workPlanModal.order.customer?.name || workPlanModal.order.customer?.firstName}
                </Text>
                <Text style={[styles.summaryText, { color: dc.textMuted }]}>
                  Service: {workPlanModal.order.serviceType || 'Custom Order'}
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: dc.textDark }]}>Work Timeline</Text>
            <Text style={[styles.sectionHelp, { color: dc.textMuted }]}>
              Set estimated days for each stage. Consultation is managed by admin.
            </Text>

            {/* Stage Progress Indicator */}
            <View style={styles.stageProgressContainer}>
              {stageConfig.map((stage, index) => (
                <View key={stage.key} style={styles.stageProgressItem}>
                  <View style={[styles.stageProgressDot, { backgroundColor: stage.color }]}>
                    <Ionicons name={stage.icon} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.stageProgressLabel, { color: dc.textMuted }]}>{stage.name}</Text>
                  {index < stageConfig.length - 1 && (
                    <View style={[styles.stageProgressLine, { backgroundColor: dc.border }]} />
                  )}
                </View>
              ))}
            </View>

            {/* Stage Inputs */}
            {stageConfig.map((stage, index) => (
              <View key={stage.key} style={[styles.fixedStageCard, { backgroundColor: dc.bgLight, borderLeftColor: stage.color }]}>
                <View style={styles.fixedStageHeader}>
                  <View style={[styles.fixedStageIcon, { backgroundColor: stage.color + '20' }]}>
                    <Ionicons name={stage.icon} size={20} color={stage.color} />
                  </View>
                  <View style={styles.fixedStageInfo}>
                    <Text style={[styles.fixedStageName, { color: dc.textDark }]}>{stage.name}</Text>
                    {stage.adminControlled ? (
                      <Text style={[styles.fixedStageNote, { color: staticColors.info }]}>
                        Admin controlled
                      </Text>
                    ) : (
                      <Text style={[styles.fixedStageNote, { color: dc.textMuted }]}>
                        Stage {index + 1} of 4
                      </Text>
                    )}
                  </View>
                  <View style={styles.fixedStageBadge}>
                    <Text style={[styles.fixedStageBadgeText, { color: dc.textMuted }]}>{index + 1}</Text>
                  </View>
                </View>

                {stage.adminControlled ? (
                  <View style={[styles.adminControlledNote, { backgroundColor: staticColors.infoLight }]}>
                    <Ionicons name="information-circle" size={16} color={staticColors.info} />
                    <Text style={[styles.adminControlledText, { color: staticColors.info }]}>
                      Admin will mark this complete after discussing details with you
                    </Text>
                  </View>
                ) : (
                  <View style={styles.fixedStageInputs}>
                    <View style={styles.daysInputRow}>
                      <Text style={[styles.daysLabel, { color: dc.textMuted }]}>Estimated days:</Text>
                      <TextInput
                        style={[styles.daysInput, { backgroundColor: dc.cardBg, borderColor: dc.border, color: dc.textDark }]}
                        keyboardType="number-pad"
                        value={String(fixedStages[stage.key]?.estimatedDays || '')}
                        onChangeText={(text) => updateFixedStage(stage.key, 'estimatedDays', text)}
                      />
                    </View>
                    <TextInput
                      style={[styles.input, styles.notesInput, { backgroundColor: dc.cardBg, borderColor: dc.border, color: dc.textDark }]}
                      placeholder="Notes (optional)"
                      placeholderTextColor={dc.textMuted}
                      value={fixedStages[stage.key]?.notes || ''}
                      onChangeText={(text) => updateFixedStage(stage.key, 'notes', text)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                )}
              </View>
            ))}

            <View style={styles.planSummary}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: dc.textMuted }]}>Total Stages</Text>
                <Text style={styles.summaryValue}>4</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: dc.textMuted }]}>Est. Work Days</Text>
                <Text style={styles.summaryValue}>{totalDays}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: dc.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: dc.bgLight, borderColor: dc.border }]}
              onPress={() => setWorkPlanModal({ visible: false, order: null })}
            >
              <Text style={[styles.cancelButtonText, { color: dc.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={submitWorkPlan}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Accept Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Action Menu - Compact dropdown style positioned near hamburger
  const ActionMenuModal = ({ designColors: dc }) => (
    <Modal
      visible={actionMenu.visible}
      transparent
      animationType="fade"
      onRequestClose={closeActionMenu}
    >
      <TouchableOpacity
        style={styles.actionMenuOverlay}
        activeOpacity={1}
        onPress={closeActionMenu}
      >
        <View
          style={[
            styles.actionDropdown,
            {
              backgroundColor: dc.cardBg,
              position: 'absolute',
              left: actionMenu.position.x,
              top: actionMenu.position.y
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: dc.border }]}
            onPress={handleMessageCustomer}
          >
            <Ionicons name="chatbubble-outline" size={18} color={staticColors.primary} />
            <Text style={[styles.dropdownText, { color: dc.textDark }]}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomColor: dc.border }]}
            onPress={handleUpdateProgress}
          >
            <Ionicons name="time-outline" size={18} color={staticColors.warning} />
            <Text style={[styles.dropdownText, { color: dc.textDark }]}>Update Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handleCompleteFromMenu}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={staticColors.success} />
            <Text style={[styles.dropdownText, { color: dc.textDark }]}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Get filter counts
  const getFilterCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  if (loading && !orders.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: designColors.bgLight }]}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterContainer, { backgroundColor: designColors.cardBg, borderBottomColor: designColors.border }]}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton value="all" label="All" count={0} designColors={designColors} />
        <FilterButton value="awaiting_plan" label="Pending" count={0} designColors={designColors} />
        <FilterButton value="in_progress" label="In Progress" count={0} designColors={designColors} />
        <FilterButton value="ready" label="Ready" count={0} designColors={designColors} />
        <FilterButton value="completed" label="Completed" count={0} designColors={designColors} />
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <OrderCard order={item} designColors={designColors} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={designColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={designColors.textMuted} />
            <Text style={[styles.emptyTitle, { color: designColors.textDark }]}>No orders found</Text>
            <Text style={[styles.emptyText, { color: designColors.textMuted }]}>
              {filter === 'all'
                ? "You don't have any orders yet"
                : `No ${filter.replace('_', ' ')} orders`}
            </Text>
          </View>
        }
      />

      <WorkPlanModal designColors={designColors} />
      <ActionMenuModal designColors={designColors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Filter styles
  filterContainer: {
    maxHeight: 60,
    borderBottomWidth: 1
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm
  },
  filterButtonActive: {
    backgroundColor: staticColors.primary
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500'
  },
  filterTextActive: {
    color: '#FFFFFF'
  },
  filterBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  filterBadgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  filterBadgeTextActive: {
    color: '#FFFFFF'
  },

  // List styles
  list: {
    padding: spacing.md
  },

  // Order Card styles - Clean mockup design
  orderCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  customerInfo: {
    flex: 1
  },
  customerName: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700'
  },
  orderId: {
    fontSize: 13,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 12
  },
  statusBadgeOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  orderInfoRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.sm
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  infoIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    marginVertical: spacing.md
  },
  addressRowWithMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  addressTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500'
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    zIndex: 10
  },
  // Decorative corner wave
  decorativeCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    pointerEvents: 'none',
    height: 60,
    overflow: 'hidden'
  },
  decorativeWave: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 136, 204, 0.06)'
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginTop: spacing.lg
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginTop: spacing.sm
  },

  // Modal styles
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700'
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1
  },
  orderSummary: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  summaryText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginBottom: spacing.xs
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  sectionHelp: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginBottom: spacing.md
  },
  stageInputGroup: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg
  },
  stageNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  stageNumberText: {
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  stageInputs: {
    flex: 1
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
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
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginRight: spacing.sm
  },
  daysInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
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
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg
  },
  addStageText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    color: staticColors.primary,
    marginLeft: spacing.xs
  },
  planSummary: {
    flexDirection: 'row',
    backgroundColor: staticColors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xl
  },
  summaryItem: {},
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular'
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    color: staticColors.primary
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  submitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.primary
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  disabledButton: {
    opacity: 0.6
  },

  // Action Menu - Compact dropdown styles
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  actionDropdown: {
    borderRadius: 12,
    minWidth: 160,
    ...shadows.lg
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500'
  },

  // Fixed Stage Styles
  stageProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm
  },
  stageProgressItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative'
  },
  stageProgressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  stageProgressLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    textAlign: 'center'
  },
  stageProgressLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2
  },
  fixedStageCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4
  },
  fixedStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  fixedStageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  fixedStageInfo: {
    flex: 1
  },
  fixedStageName: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  fixedStageNote: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginTop: 2
  },
  fixedStageBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fixedStageBadgeText: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  fixedStageInputs: {
    marginTop: spacing.sm
  },
  adminControlledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs
  },
  adminControlledText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat-Regular'
  },
  notesInput: {
    minHeight: 50,
    textAlignVertical: 'top',
    marginTop: spacing.sm
  }
});
