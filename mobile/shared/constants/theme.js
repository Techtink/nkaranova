export const colors = {
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',

  secondary: '#f59e0b',
  secondaryLight: '#fbbf24',
  secondaryDark: '#d97706',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Neutrals
  white: '#ffffff',
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
  black: '#000000',

  // Semantic
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',

  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',

  border: '#e5e7eb'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36
};

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5
  }
};

export default {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows
};
