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
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Design colors matching the mockup
const designColors = {
  dark: '#1a1a1a',
  accent: '#5c8d6a',
  accentLight: '#6b9e7a',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e5e5e5',
  inputBg: '#f0f0f0',
  success: '#22c55e'
};

export default function VerificationCodeScreen({ navigation, route }) {
  const email = route?.params?.email || 'user@example.com';
  const onVerify = route?.params?.onVerify;
  const codeLength = route?.params?.codeLength || 4;

  const [code, setCode] = useState(Array(codeLength).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Countdown timer for resend
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];

    // Handle paste
    if (text.length > 1) {
      const pastedCode = text.slice(0, codeLength).split('');
      pastedCode.forEach((digit, i) => {
        if (i < codeLength) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);
      if (pastedCode.length === codeLength) {
        inputRefs.current[codeLength - 1]?.blur();
      }
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== codeLength) {
      Alert.alert('Error', `Please enter the ${codeLength}-digit code`);
      return;
    }

    setLoading(true);
    try {
      if (onVerify) {
        await onVerify(fullCode);
      } else {
        // Default behavior - just navigate
        Alert.alert('Success', 'Code verified successfully!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = () => {
    Alert.alert('Biometric', 'Biometric verification coming soon!');
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  const handleSocialLogin = (provider) => {
    Alert.alert('Social Login', `${provider} login coming soon!`);
  };

  // Mask email for display
  const maskedEmail = email.replace(/(.{3})(.*)(@.*)/, '$1***$3');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={designColors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={designColors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitleSmall}>Go ahead and set up</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={32} color={designColors.success} />
          </View>
          <Text style={styles.codePreview}>x x x x x x</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify your account</Text>
        <Text style={styles.subtitle}>
          Enter {codeLength} digits verification code we have sent to{' '}
          <Text style={styles.emailLink}>{maskedEmail}</Text>
        </Text>

        {/* Code Inputs */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Timer */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendTimer > 0}
        >
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={designColors.white} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Biometric Option */}
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometric}
        >
          <Ionicons name="finger-print-outline" size={20} color={designColors.textPrimary} />
          <Text style={styles.biometricText}>Biometric Verification</Text>
        </TouchableOpacity>

        {/* Social Login Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or login with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Google')}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Facebook')}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.white
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designColors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitleSmall: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: designColors.textMuted
  },
  content: {
    flex: 1,
    paddingHorizontal: 24
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designColors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  codePreview: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: designColors.textMuted,
    letterSpacing: 4
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    color: designColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: designColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32
  },
  emailLink: {
    fontFamily: 'Montserrat-Medium',
    color: designColors.accent,
    textDecorationLine: 'underline'
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16
  },
  codeInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: designColors.inputBg,
    fontSize: 24,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    textAlign: 'center',
    color: designColors.textPrimary
  },
  codeInputFilled: {
    backgroundColor: designColors.lightGray,
    borderWidth: 1,
    borderColor: designColors.accent
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 24
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: designColors.accent,
    fontWeight: '500'
  },
  resendTextDisabled: {
    color: designColors.textMuted
  },
  verifyButton: {
    backgroundColor: designColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  verifyButtonDisabled: {
    opacity: 0.7
  },
  verifyButtonText: {
    color: designColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600'
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designColors.border,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 24
  },
  biometricText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    color: designColors.textPrimary
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: designColors.border
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: designColors.textMuted,
    marginHorizontal: 16
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designColors.border,
    paddingVertical: 14,
    gap: 8
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    color: designColors.textPrimary
  }
});
