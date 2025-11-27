import { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../../../shared/context/AuthContext';
import { colors } from '../../../../shared/constants/theme';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';

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
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
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
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary
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
      <Stack.Screen name="Login" component={LoginScreen} />
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
              backgroundColor: colors.primary
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
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
