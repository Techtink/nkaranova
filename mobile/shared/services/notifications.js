import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Check if we're in Expo Go - notifications don't work there in SDK 53+
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load notifications module only when not in Expo Go
let Notifications = null;
let Device = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false
      })
    });
  } catch (error) {
    console.log('Notification setup skipped:', error.message);
  }
}

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async registerForPushNotifications() {
    // Skip if notifications not available (Expo Go)
    if (!Notifications || !Device) {
      console.log('Push notifications not available in Expo Go');
      return null;
    }

    let token = null;

    // Must be a physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId
        })
      ).data;
      this.expoPushToken = token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }

    // Android channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6'
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'New message notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6'
      });

      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Bookings',
        description: 'Booking updates and reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6'
      });
    }

    return token;
  }

  async savePushToken(token) {
    if (!token) return;

    try {
      await api.post('/users/push-token', {
        pushToken: token,
        platform: Platform.OS
      });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async removePushToken() {
    if (!this.expoPushToken) return;

    try {
      await api.delete('/users/push-token', {
        data: { pushToken: this.expoPushToken }
      });
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  setupNotificationListeners(navigation) {
    // Skip if notifications not available (Expo Go)
    if (!Notifications) {
      return () => {}; // Return empty cleanup function
    }

    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { data } = notification.request.content;
        this.handleNotificationData(data);
      }
    );

    // Listener for notification interactions (taps)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;
        this.handleNotificationNavigation(data, navigation);
      }
    );

    return () => {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
      }
    };
  }

  handleNotificationData(data) {
    // Handle foreground notification data
    console.log('Notification received:', data);
  }

  handleNotificationNavigation(data, navigation) {
    if (!navigation || !data) return;

    const { type, conversationId, bookingId, tailorId } = data;

    switch (type) {
      case 'message':
        if (conversationId) {
          navigation.navigate('Chat', { conversationId });
        } else {
          navigation.navigate('Messages');
        }
        break;

      case 'booking':
      case 'booking_confirmed':
      case 'booking_declined':
      case 'booking_completed':
        if (bookingId) {
          navigation.navigate('Bookings');
        }
        break;

      case 'new_review':
        navigation.navigate('Profile');
        break;

      case 'tailor_verified':
        navigation.navigate('Profile');
        break;

      default:
        // Navigate to home/dashboard
        break;
    }
  }

  async setBadgeCount(count) {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }

  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    if (!Notifications) return null;
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true
        },
        trigger: trigger || null // null means immediate
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId) {
    if (!Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications() {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
