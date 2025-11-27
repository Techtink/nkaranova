import { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role: 'customer'
      });
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Unable to register'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Tailor Connect today</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl
  },
  form: {
    gap: spacing.md
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    marginBottom: spacing.sm
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
    marginTop: spacing.xl,
    alignItems: 'center'
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600'
  }
});
