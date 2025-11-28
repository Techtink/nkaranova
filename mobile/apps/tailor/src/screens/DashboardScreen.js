import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { ordersAPI } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useTheme } from '../../../../shared/context/ThemeContext';
import { spacing, borderRadius, shadows } from '../../../../shared/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.34;

// Abstract header art - playful shapes with different faded colors
const HeaderArt = () => (
  <Svg style={styles.headerArt} width={SCREEN_WIDTH} height={HEADER_HEIGHT} viewBox={`0 0 ${SCREEN_WIDTH} ${HEADER_HEIGHT}`}>
    {/* Large purple circle on left */}
    <Circle cx="-30" cy={HEADER_HEIGHT * 0.35} r="120" fill="rgba(139,92,246,0.15)" />
    {/* Medium pink circle */}
    <Circle cx="80" cy={HEADER_HEIGHT * 0.75} r="70" fill="rgba(236,72,153,0.12)" />
    {/* Small blue circle top */}
    <Circle cx="140" cy={HEADER_HEIGHT * 0.15} r="35" fill="rgba(59,130,246,0.14)" />
    {/* Cyan ellipse */}
    <Ellipse cx="20" cy={HEADER_HEIGHT * 0.6} rx="90" ry="45" fill="rgba(34,211,238,0.08)" />
    {/* Small orange accent */}
    <Circle cx="200" cy={HEADER_HEIGHT * 0.4} r="25" fill="rgba(251,146,60,0.1)" />
    {/* Large faded circle right side */}
    <Circle cx={SCREEN_WIDTH + 30} cy={HEADER_HEIGHT * 0.2} r="100" fill="rgba(167,139,250,0.08)" />
    {/* Small green accent bottom */}
    <Circle cx="280" cy={HEADER_HEIGHT * 0.85} r="20" fill="rgba(52,211,153,0.1)" />
  </Svg>
);

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    inProgress: 0,
    awaiting: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const statsScrollRef = useRef(null);

  // Quick action colors - use theme action colors (background + icon)
  const quickActionColors = {
    calendar: { bg: colors.actionGreen, icon: colors.actionGreenIcon },
    portfolio: { bg: colors.actionBlue, icon: colors.actionBlueIcon },
    clock: { bg: colors.actionOrange, icon: colors.actionOrangeIcon },
    messages: { bg: colors.actionPurple, icon: colors.actionPurpleIcon },
    earnings: { bg: colors.actionRed, icon: colors.actionRedIcon }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ordersRes = await ordersAPI.getTailorOrders({ limit: 10 });
      const ordersData = ordersRes.data.data || [];
      setOrders(ordersData);

      const inProgress = ordersData.filter(o => o.status === 'in_progress').length;
      const awaiting = ordersData.filter(o => ['awaiting_plan', 'pending'].includes(o.status)).length;
      const completed = ordersData.filter(o => ['completed', 'delivered'].includes(o.status)).length;

      setStats({ inProgress, awaiting, completed });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const changeMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const formatMonth = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const upcomingDeliveries = orders.filter(o => o.status === 'in_progress');

  const formatDeliveryDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Stat Card - Bigger, no icons, descriptive text underneath
  const StatCard = ({ label, value, subText, subColor }) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardBg }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      {subText && <Text style={[styles.statSubText, { color: subColor || colors.warning }]}>{subText}</Text>}
    </View>
  );

  // Quick Action - Colored circle background with icon
  const QuickAction = ({ icon, bgColor, iconColor, onPress }) => (
    <TouchableOpacity
      style={[styles.quickActionBtn, { backgroundColor: bgColor }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
    </TouchableOpacity>
  );

  // Delivery Card - Wider
  const DeliveryCard = ({ order }) => {
    const customer = order.customer;
    return (
      <TouchableOpacity
        style={[styles.deliveryCard, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('Orders', { orderId: order._id })}
      >
        <View style={styles.deliveryCardLeft}>
          <View style={[styles.deliveryAvatar, { backgroundColor: colors.bgSecondary }]}>
            <Ionicons name="person" size={20} color={colors.textMuted} />
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={[styles.deliveryCustomer, { color: colors.textPrimary }]}>
              {customer?.firstName || customer?.name || 'Customer'}
            </Text>
            <Text style={[styles.deliveryItems, { color: colors.textMuted }]}>
              {order.items?.length || 1} item{(order.items?.length || 1) > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.deliveryCardRight}>
          <Text style={[styles.deliveryDate, { color: colors.textMuted }]}>{formatDeliveryDate(order.estimatedDelivery)}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bgLight }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalOrders = stats.inProgress + stats.awaiting + stats.completed;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgLight }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header - 25% of screen, dark blue */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <HeaderArt />

        {/* Top Row: Profile LEFT, Date RIGHT */}
        <View style={styles.topRow}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={22} color="rgba(255,255,255,0.6)" />
              )}
            </View>
            <View>
              <Text style={styles.profileName}>{user?.firstName || user?.name?.split(' ')[0] || 'Tailor'}</Text>
              <Text style={styles.profileUsername}>@tailor</Text>
            </View>
          </View>

          {/* Month Selector on RIGHT */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={12} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{formatMonth(selectedMonth)}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
              <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Orders - Prominently displayed */}
        <View style={styles.totalSection}>
          <Text style={styles.totalValue}>{totalOrders}</Text>
          <Text style={styles.totalLabel}>Total orders accepted</Text>
        </View>
      </View>

      {/* Stat Cards - Horizontal scroll, bigger, no icons */}
      <ScrollView
        ref={statsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
        style={styles.statsScroll}
      >
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Awaiting" value={stats.awaiting} subText="All planned" subColor={colors.warning} />
        <StatCard label="Completed" value={stats.completed} subText="This month" subColor={colors.success} />
      </ScrollView>

      {/* Quick Actions - Colored circles with icons */}
      <View style={styles.quickActionsContainer}>
        <QuickAction
          icon="calendar-outline"
          bgColor={quickActionColors.calendar.bg}
          iconColor={quickActionColors.calendar.icon}
          onPress={() => navigation.navigate('Bookings')}
        />
        <QuickAction
          icon="images-outline"
          bgColor={quickActionColors.portfolio.bg}
          iconColor={quickActionColors.portfolio.icon}
          onPress={() => navigation.navigate('Portfolio')}
        />
        <QuickAction
          icon="time-outline"
          bgColor={quickActionColors.clock.bg}
          iconColor={quickActionColors.clock.icon}
          onPress={() => navigation.navigate('Availability')}
        />
        <QuickAction
          icon="chatbubbles-outline"
          bgColor={quickActionColors.messages.bg}
          iconColor={quickActionColors.messages.icon}
          onPress={() => navigation.navigate('Messages')}
        />
        <QuickAction
          icon="card-outline"
          bgColor={quickActionColors.earnings.bg}
          iconColor={quickActionColors.earnings.icon}
          onPress={() => navigation.navigate('PaymentSettings')}
        />
      </View>

      {/* Upcoming Deliveries - Wider cards */}
      <View style={styles.deliveriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Deliveries</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={[styles.showAllText, { color: colors.primary }]}>Show all &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.deliveriesCard, { backgroundColor: colors.cardBg }]}>
          {upcomingDeliveries.length > 0 ? (
            upcomingDeliveries.slice(0, 3).map((order) => (
              <DeliveryCard key={order._id} order={order} />
            ))
          ) : (
            <View style={styles.emptyDeliveries}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No upcoming deliveries</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Orders in progress will appear here</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: spacing.xxl * 2 }} />
    </ScrollView>
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

  // Header - 25% of screen
  header: {
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 30,
    position: 'relative',
    overflow: 'hidden'
  },
  headerArt: {
    position: 'absolute',
    top: 0,
    left: 0
  },

  // Top row - Profile LEFT, Date RIGHT
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  profileUsername: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  monthArrow: {
    padding: 2
  },
  monthText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    color: '#FFFFFF',
    marginHorizontal: 4
  },

  // Total section - Prominent display
  totalSection: {
    marginTop: spacing.sm
  },
  totalValue: {
    fontSize: 52,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    color: '#FFFFFF'
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2
  },

  // Stats - Bigger cards, no icons
  statsScroll: {
    marginTop: -25
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm
  },
  statCard: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.md,
    minWidth: 130,
    minHeight: 80,
    justifyContent: 'center',
    ...shadows.md
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500'
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    marginTop: 2
  },
  statSubText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    marginTop: 4
  },

  // Quick actions - Circle outlines
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg
  },
  quickActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Deliveries section - Wider cards
  deliveriesSection: {
    paddingHorizontal: spacing.lg
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700'
  },
  showAllText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  deliveriesCard: {
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.sm
  },
  deliveryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    borderBottomWidth: 1
  },
  deliveryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  deliveryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  deliveryInfo: {
    flex: 1
  },
  deliveryCustomer: {
    fontSize: 15,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  deliveryItems: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginTop: 2
  },
  deliveryCardRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deliveryDate: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    marginRight: spacing.xs
  },

  // Empty state
  emptyDeliveries: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginTop: spacing.sm
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginTop: spacing.xs
  }
});
