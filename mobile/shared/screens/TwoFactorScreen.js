import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

const CODE_LENGTH = 6;

export default function TwoFactorScreen({ navigation }) {
  const { pending2FA, verify2FA, cancel2FA } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the input when screen mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCodeChange = (text) => {
    // Only allow numbers for TOTP code, alphanumeric for backup
    const cleaned = useBackupCode ? text.toUpperCase() : text.replace(/[^0-9]/g, '');
    const maxLength = useBackupCode ? 8 : CODE_LENGTH;

    if (cleaned.length <= maxLength) {
      setCode(cleaned);

      // Auto-submit when code is complete (only for TOTP)
      if (!useBackupCode && cleaned.length === CODE_LENGTH) {
        handleVerify(cleaned);
      }
    }
  };

  const handleVerify = async (verifyCode = code) => {
    if (!verifyCode || verifyCode.length < (useBackupCode ? 8 : CODE_LENGTH)) {
      Alert.alert('Error', 'Please enter a valid code');
      return;
    }

    setLoading(true);
    try {
      await verify2FA(verifyCode, useBackupCode);
      // Navigation will be handled by AuthContext state change
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || error.message || 'Invalid code. Please try again.'
      );
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    cancel2FA();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
  };

  // Render individual code boxes for TOTP
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            code.length === i && styles.codeBoxActive
          ]}
        >
          <Text style={styles.codeDigit}>{code[i] || ''}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          {pending2FA?.email ? `Signing in as ${pending2FA.email}` : 'Enter your verification code'}
        </Text>

        {!useBackupCode ? (
          <>
            <Text style={styles.instruction}>
              Enter the 6-digit code from your authenticator app
            </Text>

            <View style={styles.codeContainer}>
              {renderCodeBoxes()}
            </View>

            {/* Hidden input for keyboard */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
            />
          </>
        ) : (
          <>
            <Text style={styles.instruction}>
              Enter one of your 8-character backup codes
            </Text>

            <TextInput
              ref={inputRef}
              style={styles.backupInput}
              value={code}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              maxLength={8}
              placeholder="XXXXXXXX"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={toggleBackupCode}>
          <Text style={styles.linkText}>
            {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl
  },
  backButton: {
    marginBottom: spacing.xl
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  instruction: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  codeBox: {
    width: 45,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary
  },
  codeBoxActive: {
    borderColor: colors.primary
  },
  codeDigit: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.textPrimary
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0
  },
  backupInput: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.xl,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xl
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center'
  },
  linkText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500'
  },
  cancelButton: {
    marginTop: spacing.md,
    alignItems: 'center'
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.sm
  }
});
