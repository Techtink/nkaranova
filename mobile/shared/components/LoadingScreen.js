import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '../constants/theme';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary
  },
  message: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary
  }
});
