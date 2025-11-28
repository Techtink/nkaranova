import { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../../shared/context/AuthContext';
import { colors } from '../../../../shared/constants/theme';

// Auth/Onboarding Screens
import OnboardingScreen from '../../../../shared/screens/OnboardingScreen';
import AuthScreen from '../../../../shared/screens/AuthScreen';
import VerificationCodeScreen from '../../../../shared/screens/VerificationCodeScreen';
import TwoFactorScreen from '../../../../shared/screens/TwoFactorScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import TailorsListScreen from '../screens/TailorsListScreen';
import TailorProfileScreen from '../screens/TailorProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import BookingsScreen from '../screens/BookingsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

// Shared Screens
import NotificationsScreen from '../../../../shared/screens/NotificationsScreen';
import ChangePasswordScreen from '../../../../shared/screens/ChangePasswordScreen';
import HelpSupportScreen from '../../../../shared/screens/HelpSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Design accent color
const accentColor = '#5c8d6a';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: true,
        headerStyle: {
          backgroundColor: accentColor
        },
        headerTintColor: colors.white
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Tailor Connect' }}
      />
      <Tab.Screen
        name="Explore"
        component={TailorsListScreen}
        options={{ title: 'Find Tailors' }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{ title: 'Gallery' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Onboarding">
        {(props) => (
          <OnboardingScreen
            {...props}
            appName="Tailor Connect"
            appType="customer"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Auth"
        options={{
          animation: 'slide_from_bottom'
        }}
      >
        {(props) => <AuthScreen {...props} appType="customer" />}
      </Stack.Screen>
      <Stack.Screen
        name="VerificationCode"
        component={VerificationCodeScreen}
      />
      <Stack.Screen
        name="TwoFactor"
        component={TwoFactorScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, setNavigationRef } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [navigationRef.current]);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: accentColor
            },
            headerTintColor: colors.white,
            headerBackTitleVisible: false
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TailorProfile"
            component={TailorProfileScreen}
            options={{ title: 'Tailor Profile' }}
          />
          <Stack.Screen
            name="TailorsList"
            component={TailorsListScreen}
            options={{ title: 'Tailors' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="Bookings"
            component={BookingsScreen}
            options={{ title: 'My Bookings' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'My Orders' }}
          />
          <Stack.Screen
            name="BookAppointment"
            component={BookAppointmentScreen}
            options={{ title: 'Book Appointment' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: 'My Favorites' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: 'Change Password' }}
          />
          <Stack.Screen
            name="Support"
            component={HelpSupportScreen}
            options={{ title: 'Help & Support' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
