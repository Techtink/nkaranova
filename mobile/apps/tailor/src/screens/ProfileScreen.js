import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../shared/context/AuthContext';
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress, danger, badge }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? colors.error : colors.textSecondary}
        />
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: user?.profilePhoto || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.reviewCount || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.workCount || 0}</Text>
            <Text style={styles.statLabel}>Works</Text>
          </View>
        </View>
      </View>

      {/* Verification Status */}
      <View style={styles.section}>
        <View style={styles.verificationCard}>
          <View style={styles.verificationInfo}>
            <Ionicons
              name={profile?.isVerified ? 'checkmark-circle' : 'time-outline'}
              size={32}
              color={profile?.isVerified ? colors.success : colors.warning}
            />
            <View style={styles.verificationText}>
              <Text style={styles.verificationTitle}>
                {profile?.isVerified ? 'Verified Tailor' : 'Not Verified'}
              </Text>
              <Text style={styles.verificationSubtitle}>
                {profile?.isVerified
                  ? 'Your profile is verified'
                  : 'Get verified to build trust'}
              </Text>
            </View>
          </View>
          {!profile?.isVerified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => navigation.navigate('Verification')}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuItem
            icon="images-outline"
            label="Portfolio"
            onPress={() => navigation.navigate('Portfolio')}
            badge={profile?.workCount}
          />
          <MenuItem
            icon="time-outline"
            label="Availability"
            onPress={() => navigation.navigate('Availability')}
          />
          <MenuItem
            icon="pricetag-outline"
            label="Pricing"
            onPress={() => navigation.navigate('Pricing')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <MenuItem
            icon="card-outline"
            label="Payment Settings"
            onPress={() => navigation.navigate('PaymentSettings')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('Support')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.white,
    marginTop: spacing.md
  },
  email: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.md
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  verificationText: {
    marginLeft: spacing.md
  },
  verificationTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  verificationSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuLabel: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginLeft: spacing.md
  },
  menuLabelDanger: {
    color: colors.error
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600'
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginVertical: spacing.xl
  }
});
