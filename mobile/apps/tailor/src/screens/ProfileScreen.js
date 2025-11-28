import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useTheme } from '../../../../shared/context/ThemeContext';
import { tailorsAPI } from '../../../../shared/services/api';
import { spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';
import config from '../../../../shared/config/env';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.35;

// Abstract art shapes for header decoration (same as dashboard)
const HeaderArt = ({ isDark }) => (
  <Svg
    width={180}
    height={HEADER_HEIGHT}
    style={staticStyles.headerArt}
    viewBox="0 0 180 280"
  >
    <Ellipse cx="30" cy="180" rx="60" ry="80" fill={isDark ? '#3D2B7A' : '#4A3A8C'} opacity="0.5" />
    <Circle cx="100" cy="220" r="50" fill={isDark ? '#4B3A8E' : '#5B4A9E'} opacity="0.4" />
    <Ellipse cx="-10" cy="140" rx="40" ry="60" fill={isDark ? '#0E0830' : '#1E1250'} opacity="0.6" />
    <Path
      d="M60 250 Q90 200 70 150 Q50 100 80 80"
      stroke={isDark ? '#5B4A9F' : '#6B5AAF'}
      strokeWidth="3"
      fill="none"
      opacity="0.5"
    />
    <Circle cx="50" cy="260" r="30" fill={isDark ? '#6B5AB0' : '#7B6AC0'} opacity="0.3" />
  </Svg>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { isDarkMode, colors, toggleDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Get profile image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    // Ensure path has leading slash
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${config.imageBaseUrl}${path}`;
  };

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

  const showComingSoon = (feature) => {
    Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
  };

  const MenuItem = ({ icon, label, onPress, danger, badge, rightElement }) => (
    <TouchableOpacity
      style={[staticStyles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!!rightElement}
    >
      <View style={staticStyles.menuLeft}>
        <View style={[
          staticStyles.menuIconContainer,
          { backgroundColor: danger ? colors.error + '15' : colors.primary + '15' }
        ]}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? colors.error : colors.primary}
          />
        </View>
        <Text style={[
          staticStyles.menuLabel,
          { color: danger ? colors.error : colors.textPrimary }
        ]}>
          {label}
        </Text>
      </View>
      <View style={staticStyles.menuRight}>
        {badge && (
          <View style={[staticStyles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[staticStyles.badgeText, { color: colors.white }]}>{badge}</Text>
          </View>
        )}
        {rightElement ? rightElement : (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[staticStyles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* Profile Header with Abstract Art */}
      <View style={[staticStyles.header, { backgroundColor: colors.headerBg }]}>
        <HeaderArt isDark={isDarkMode} />
        <View style={staticStyles.headerContent}>
          <Image
            source={{ uri: getProfileImageUrl(user?.profilePhoto) || 'https://via.placeholder.com/100' }}
            style={[staticStyles.avatar, { borderColor: colors.white }]}
          />
          <Text style={[staticStyles.name, { color: colors.white }]}>{user?.name}</Text>
          <Text style={[staticStyles.email, { color: colors.textLight }]}>{user?.email}</Text>
          <View style={staticStyles.statsRow}>
            <View style={staticStyles.statItem}>
              <Text style={[staticStyles.statValue, { color: colors.white }]}>{profile?.rating?.toFixed(1) || 'N/A'}</Text>
              <Text style={[staticStyles.statLabel, { color: colors.textLight }]}>Rating</Text>
            </View>
            <View style={staticStyles.statDivider} />
            <View style={staticStyles.statItem}>
              <Text style={[staticStyles.statValue, { color: colors.white }]}>{profile?.reviewCount || 0}</Text>
              <Text style={[staticStyles.statLabel, { color: colors.textLight }]}>Reviews</Text>
            </View>
            <View style={staticStyles.statDivider} />
            <View style={staticStyles.statItem}>
              <Text style={[staticStyles.statValue, { color: colors.white }]}>{profile?.workCount || 0}</Text>
              <Text style={[staticStyles.statLabel, { color: colors.textLight }]}>Works</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Verification Status */}
      <View style={staticStyles.section}>
        <View style={[staticStyles.verificationCard, { backgroundColor: colors.cardBg }, shadows.sm]}>
          <View style={staticStyles.verificationInfo}>
            <View style={[
              staticStyles.verificationIcon,
              { backgroundColor: profile?.isVerified ? colors.success + '15' : colors.warning + '15' }
            ]}>
              <Ionicons
                name={profile?.isVerified ? 'checkmark-circle' : 'time-outline'}
                size={28}
                color={profile?.isVerified ? colors.success : colors.warning}
              />
            </View>
            <View style={staticStyles.verificationText}>
              <Text style={[staticStyles.verificationTitle, { color: colors.textPrimary }]}>
                {profile?.isVerified ? 'Verified Tailor' : 'Not Verified'}
              </Text>
              <Text style={[staticStyles.verificationSubtitle, { color: colors.textMuted }]}>
                {profile?.isVerified
                  ? 'Your profile is verified'
                  : 'Get verified to build trust'}
              </Text>
            </View>
          </View>
          {!profile?.isVerified && (
            <TouchableOpacity
              style={[staticStyles.verifyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Verification')}
            >
              <Text style={[staticStyles.verifyButtonText, { color: colors.white }]}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menu Sections */}
      <View style={staticStyles.section}>
        <Text style={[staticStyles.sectionTitle, { color: colors.textMuted }]}>Business</Text>
        <View style={[staticStyles.menuCard, { backgroundColor: colors.cardBg }, shadows.sm]}>
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

      <View style={staticStyles.section}>
        <Text style={[staticStyles.sectionTitle, { color: colors.textMuted }]}>Settings</Text>
        <View style={[staticStyles.menuCard, { backgroundColor: colors.cardBg }, shadows.sm]}>
          <MenuItem
            icon="moon-outline"
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={isDarkMode ? colors.primary : colors.textMuted}
              />
            }
          />
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

      <View style={staticStyles.section}>
        <View style={[staticStyles.menuCard, { backgroundColor: colors.cardBg }, shadows.sm]}>
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={[staticStyles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

// Static styles (colors are applied dynamically from theme)
const staticStyles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    position: 'relative'
  },
  headerArt: {
    position: 'absolute',
    left: -20,
    top: 0,
    bottom: 0
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    zIndex: 1
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3
  },
  name: {
    fontSize: fontSize.xl,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginTop: spacing.md
  },
  email: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-Regular',
    marginTop: spacing.xs
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: fontSize.lg,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
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
    borderRadius: borderRadius.lg,
    padding: spacing.md
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  verificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verificationText: {
    marginLeft: spacing.md
  },
  verificationTitle: {
    fontSize: fontSize.base,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  verificationSubtitle: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
    marginTop: spacing.xs
  },
  verifyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md
  },
  verifyButtonText: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm
  },
  menuCard: {
    borderRadius: borderRadius.lg
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuLabel: {
    fontSize: fontSize.base,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    marginLeft: spacing.md
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
    marginVertical: spacing.xl
  }
});
