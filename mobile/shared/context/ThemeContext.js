import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@app_theme';

// Light mode colors
const lightColors = {
  // App colors
  headerBg: '#2D1B69',
  headerAccent: '#4A3A8C',
  primary: '#2D1B69',
  primaryLight: '#4A3A8C',
  primaryDark: '#1E1250',

  // Accent colors
  secondary: '#f59e0b',
  secondaryLight: '#fbbf24',
  secondaryDark: '#d97706',

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3b82f6',

  // Background colors
  bgPrimary: '#ffffff',
  bgSecondary: '#F8F9FC',
  bgTertiary: '#f3f4f6',
  bgLight: '#F8F9FC',
  cardBg: '#ffffff',

  // Text colors
  textPrimary: '#1A1D29',
  textSecondary: '#4b5563',
  textMuted: '#8E919E',
  textLight: 'rgba(255,255,255,0.7)',
  textInverse: '#ffffff',
  textDark: '#1A1D29',

  // UI elements
  white: '#ffffff',
  black: '#000000',
  border: '#E8EAF0',
  divider: '#E8EAF0',
  overlay: 'rgba(0,0,0,0.5)',

  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Quick action button colors (light mode)
  actionGreen: '#E8F5E9',
  actionGreenIcon: '#2E7D32',
  actionBlue: '#E3F2FD',
  actionBlueIcon: '#1565C0',
  actionOrange: '#FFF3E0',
  actionOrangeIcon: '#EF6C00',
  actionPurple: '#F3E5F5',
  actionPurpleIcon: '#7B1FA2',
  actionRed: '#FFEBEE',
  actionRedIcon: '#C62828',

  // Input colors
  inputBg: '#f0f0f0',
  inputBorder: '#e5e5e5',
  inputText: '#1a1a1a',
  inputPlaceholder: '#999999',

  // Status bar
  statusBar: 'dark-content'
};

// Dark mode colors
const darkColors = {
  // App colors
  headerBg: '#1A1025',
  headerAccent: '#2D1B69',
  primary: '#8B7FC7',
  primaryLight: '#A89DD9',
  primaryDark: '#6B5AAF',

  // Accent colors
  secondary: '#fbbf24',
  secondaryLight: '#fcd34d',
  secondaryDark: '#f59e0b',

  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Background colors
  bgPrimary: '#0F0F14',
  bgSecondary: '#1A1A24',
  bgTertiary: '#252530',
  bgLight: '#1A1A24',
  cardBg: '#1E1E2A',

  // Text colors
  textPrimary: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textLight: 'rgba(255,255,255,0.7)',
  textInverse: '#111827',
  textDark: '#F3F4F6',

  // UI elements
  white: '#ffffff',
  black: '#000000',
  border: '#2D2D3A',
  divider: '#2D2D3A',
  overlay: 'rgba(0,0,0,0.7)',

  // Grays (inverted for dark mode)
  gray50: '#111827',
  gray100: '#1f2937',
  gray200: '#374151',
  gray300: '#4b5563',
  gray400: '#6b7280',
  gray500: '#9ca3af',
  gray600: '#d1d5db',
  gray700: '#e5e7eb',
  gray800: '#f3f4f6',
  gray900: '#f9fafb',

  // Quick action button colors (dark mode - more saturated)
  actionGreen: '#1B3D2F',
  actionGreenIcon: '#4ADE80',
  actionBlue: '#1E3A5F',
  actionBlueIcon: '#60A5FA',
  actionOrange: '#3D2A1B',
  actionOrangeIcon: '#FB923C',
  actionPurple: '#2D1B4E',
  actionPurpleIcon: '#C084FC',
  actionRed: '#3D1B1B',
  actionRedIcon: '#F87171',

  // Input colors
  inputBg: '#252530',
  inputBorder: '#2D2D3A',
  inputText: '#F3F4F6',
  inputPlaceholder: '#6B7280',

  // Status bar
  statusBar: 'light-content'
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useSystemTheme, setUseSystemTheme] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes (if using system theme)
  useEffect(() => {
    if (useSystemTheme) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, useSystemTheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        const { isDark, useSystem } = JSON.parse(savedTheme);
        setUseSystemTheme(useSystem);
        if (useSystem) {
          setIsDarkMode(systemColorScheme === 'dark');
        } else {
          setIsDarkMode(isDark);
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = useCallback(async (value) => {
    setIsDarkMode(value);
    setUseSystemTheme(false);
    try {
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify({
        isDark: value,
        useSystem: false
      }));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, []);

  const setSystemTheme = useCallback(async (value) => {
    setUseSystemTheme(value);
    if (value) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
    try {
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify({
        isDark: systemColorScheme === 'dark',
        useSystem: value
      }));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [systemColorScheme]);

  const colors = isDarkMode ? darkColors : lightColors;

  const value = {
    isDarkMode,
    useSystemTheme,
    colors,
    toggleDarkMode,
    setSystemTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export color palettes for reference
export { lightColors, darkColors };
