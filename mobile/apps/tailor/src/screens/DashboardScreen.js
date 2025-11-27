import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingsAPI, tailorsAPI } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, profileRes] = await Promise.all([
        bookingsAPI.getStats(),
        tailorsAPI.getMyProfile()
      ]);
      setStats(statsRes.data.data);
      setProfile(profileRes.data.data);
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

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const QuickAction = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Ionicons name={icon} size={28} color={colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name}</Text>
        {profile?.approvalStatus === 'pending' && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={styles.pendingText}>Account pending approval</Text>
          </View>
        )}
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="calendar"
          label="Total Bookings"
          value={stats?.totalBookings || 0}
          color={colors.primary}
        />
        <StatCard
          icon="time"
          label="Pending"
          value={stats?.pending || 0}
          color={colors.warning}
        />
        <StatCard
          icon="checkmark-circle"
          label="Completed"
          value={stats?.completed || 0}
          color={colors.success}
        />
        <StatCard
          icon="star"
          label="Rating"
          value={profile?.rating?.toFixed(1) || 'N/A'}
          color={colors.secondary}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="calendar-outline"
            label="View Bookings"
            onPress={() => navigation.navigate('Bookings')}
          />
          <QuickAction
            icon="images-outline"
            label="Portfolio"
            onPress={() => navigation.navigate('Portfolio')}
          />
          <QuickAction
            icon="time-outline"
            label="Availability"
            onPress={() => navigation.navigate('Availability')}
          />
          <QuickAction
            icon="chatbubbles-outline"
            label="Messages"
            onPress={() => navigation.navigate('Messages')}
          />
        </View>
      </View>

      {/* Profile Completion */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Status</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Verification</Text>
              <View style={[
                styles.badge,
                profile.isVerified ? styles.badgeSuccess : styles.badgePending
              ]}>
                <Text style={styles.badgeText}>
                  {profile.isVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Portfolio Items</Text>
              <Text style={styles.profileValue}>{profile.workCount || 0}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Reviews</Text>
              <Text style={styles.profileValue}>{profile.reviewCount || 0}</Text>
            </View>
            {!profile.isVerified && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => navigation.navigate('Verification')}
              >
                <Text style={styles.verifyButtonText}>Get Verified</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
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
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    paddingTop: spacing.xxl
  },
  greeting: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.8)'
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.xs
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md
  },
  pendingText: {
    color: colors.white,
    marginLeft: spacing.sm,
    fontSize: fontSize.sm
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    marginTop: -spacing.lg
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: '1%',
    borderLeftWidth: 4,
    ...shadows.sm
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  section: {
    padding: spacing.md
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm
  },
  actionLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    fontWeight: '500'
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  profileLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary
  },
  profileValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  badgeSuccess: {
    backgroundColor: colors.success + '20'
  },
  badgePending: {
    backgroundColor: colors.warning + '20'
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: '500'
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
