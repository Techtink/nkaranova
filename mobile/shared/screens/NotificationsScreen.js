import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const defaultSettings = {
  pushEnabled: true,
  bookingUpdates: true,
  messageAlerts: true,
  promotions: false,
  reminders: true,
  emailNotifications: true
};

export default function NotificationsScreen() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const SettingItem = ({ icon, title, description, settingKey }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: colors.border, true: colors.primary + '50' }}
        thumbColor={settings[settingKey] ? colors.primary : colors.textMuted}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications"
            title="Enable Push Notifications"
            description="Receive notifications on your device"
            settingKey="pushEnabled"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <View style={styles.card}>
          <SettingItem
            icon="calendar"
            title="Booking Updates"
            description="New bookings, confirmations, and cancellations"
            settingKey="bookingUpdates"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="chatbubble"
            title="Message Alerts"
            description="New messages from customers/tailors"
            settingKey="messageAlerts"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="alarm"
            title="Reminders"
            description="Appointment reminders and deadlines"
            settingKey="reminders"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="megaphone"
            title="Promotions & Updates"
            description="Special offers and app updates"
            settingKey="promotions"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Notifications</Text>
        <View style={styles.card}>
          <SettingItem
            icon="mail"
            title="Email Notifications"
            description="Receive important updates via email"
            settingKey="emailNotifications"
          />
        </View>
      </View>

      <Text style={styles.footerText}>
        You can change these settings at any time. Some notifications may still be sent for important account-related updates.
      </Text>
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
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingText: {
    marginLeft: spacing.md,
    flex: 1
  },
  settingTitle: {
    fontSize: fontSize.base,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    color: colors.textPrimary
  },
  settingDescription: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md
  },
  footerText: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xl,
    lineHeight: 18
  }
});
