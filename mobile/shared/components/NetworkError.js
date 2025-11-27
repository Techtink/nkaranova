import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../constants/theme';

export default function NetworkError({ onRetry }) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.message}>
        Please check your network connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgPrimary
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl
  },
  retryText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm
  }
});
