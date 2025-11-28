import { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../../shared/context/AuthContext';
import { useTheme } from '../../../../shared/context/ThemeContext';

// Auth/Onboarding Screens
import OnboardingScreen from '../../../../shared/screens/OnboardingScreen';
import AuthScreen from '../../../../shared/screens/AuthScreen';
import VerificationCodeScreen from '../../../../shared/screens/VerificationCodeScreen';
import TwoFactorScreen from '../../../../shared/screens/TwoFactorScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import BookingsScreen from '../screens/BookingsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack Screens
import ChatScreen from '../screens/ChatScreen';
import AddWorkScreen from '../screens/AddWorkScreen';
import AvailabilityScreen from '../screens/AvailabilityScreen';
import VerificationScreen from '../screens/VerificationScreen';
import LivenessCheckScreen from '../screens/LivenessCheckScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PricingScreen from '../screens/PricingScreen';
import PaymentSettingsScreen from '../screens/PaymentSettingsScreen';

// Shared Screens
import NotificationsScreen from '../../../../shared/screens/NotificationsScreen';
import ChangePasswordScreen from '../../../../shared/screens/ChangePasswordScreen';
import HelpSupportScreen from '../../../../shared/screens/HelpSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Portfolio') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          borderTopWidth: 1
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.headerBg
        },
        headerTintColor: colors.white
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ title: 'Portfolio' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: false }}
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
            appType="tailor"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Auth"
        options={{
          animation: 'slide_from_bottom'
        }}
      >
        {(props) => <AuthScreen {...props} appType="tailor" />}
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
  const { colors } = useTheme();
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
              backgroundColor: colors.headerBg
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
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="Availability"
            component={AvailabilityScreen}
            options={{ title: 'Set Availability' }}
          />
          <Stack.Screen
            name="AddWork"
            component={AddWorkScreen}
            options={{ title: 'Add Work' }}
          />
          <Stack.Screen
            name="Verification"
            component={VerificationScreen}
            options={{ title: 'Verification' }}
          />
          <Stack.Screen
            name="LivenessCheck"
            component={LivenessCheckScreen}
            options={{
              title: 'Liveness Check',
              headerShown: false,
              presentation: 'fullScreenModal'
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="Pricing"
            component={PricingScreen}
            options={{ title: 'Pricing' }}
          />
          <Stack.Screen
            name="PaymentSettings"
            component={PaymentSettingsScreen}
            options={{ title: 'Payment Settings' }}
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
