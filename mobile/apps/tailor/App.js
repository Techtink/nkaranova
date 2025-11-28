import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../../shared/context/AuthContext';
import { CurrencyProvider } from '../../shared/context/CurrencyContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider requiredRole="tailor">
        <CurrencyProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </CurrencyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
