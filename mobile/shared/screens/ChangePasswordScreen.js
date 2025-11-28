import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password. Please check your current password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    showPassword,
    onToggleShow,
    placeholder
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleShow}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            For your security, please enter your current password before setting a new one.
          </Text>
        </View>

        <View style={styles.form}>
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showPassword={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
            placeholder="Enter current password"
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            showPassword={showNew}
            onToggleShow={() => setShowNew(!showNew)}
            placeholder="Enter new password"
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showConfirm}
            onToggleShow={() => setShowConfirm(!showConfirm)}
            placeholder="Confirm new password"
          />

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementItem}>• At least 8 characters</Text>
            <Text style={styles.requirementItem}>• One uppercase letter</Text>
            <Text style={styles.requirementItem}>• One lowercase letter</Text>
            <Text style={styles.requirementItem}>• One number</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  content: {
    padding: spacing.md
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.textSecondary,
    lineHeight: 20
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  inputGroup: {
    marginBottom: spacing.lg
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.base,
    fontFamily: 'Montserrat-Regular',
    color: colors.textPrimary
  },
  eyeButton: {
    padding: spacing.md
  },
  requirements: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md
  },
  requirementsTitle: {
    fontSize: fontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  requirementItem: {
    fontSize: fontSize.xs,
    fontFamily: 'Montserrat-Regular',
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  }
});
