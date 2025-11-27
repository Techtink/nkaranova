import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../constants/theme';

export default function EmptyState({
  icon = 'folder-open-outline',
  title = 'Nothing here yet',
  message = 'No items to display.',
  actionLabel,
  onAction
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
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
    paddingTop: spacing.xxl * 2
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg
  },
  actionText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600'
  }
});
