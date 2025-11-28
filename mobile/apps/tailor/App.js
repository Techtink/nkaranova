import { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold
} from '@expo-google-fonts/montserrat';
import { AuthProvider } from '../../shared/context/AuthContext';
import { CurrencyProvider } from '../../shared/context/CurrencyContext';
import { ThemeProvider, useTheme } from '../../shared/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Inner component that uses theme
function AppContent() {
  const { isDarkMode, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider requiredRole="tailor">
            <CurrencyProvider>
              <AppContent />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}
