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
  ScrollView,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Design colors matching the mockup
const designColors = {
  dark: '#1a1a1a',
  darkHeader: '#2a2a2a',
  accent: '#5c8d6a',
  accentLight: '#6b9e7a',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e5e5e5',
  inputBg: '#f8f8f8'
};

export default function AuthScreen({ navigation, appType = 'customer' }) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'login' ? 0 : 1,
      useNativeDriver: false,
      friction: 8
    }).start();
  }, [activeTab]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requires2FA) {
        navigation.navigate('TwoFactor');
      }
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || error.message || 'Unable to login'
      );
    } finally {
      setLoading(false);
    }
  };

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
        role: appType === 'tailor' ? 'tailor' : 'customer'
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

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleSocialLogin = (provider) => {
    Alert.alert('Social Login', `${provider} login coming soon!`);
  };

  const tabIndicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designColors.dark} />

      {/* Dark Header */}
      <View style={styles.darkHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={designColors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Go ahead and set up{'\n'}your account</Text>
        <Text style={styles.headerSubtitle}>
          Sign in-up to enjoy the best managing experience
        </Text>
      </View>

      {/* White Content Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.whiteContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { left: tabIndicatorLeft }
              ]}
            />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('register')}
            >
              <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {activeTab === 'register' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={designColors.textMuted} style={styles.inputIcon} />
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={designColors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={designColors.textMuted} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="micahmad@potarastudio.com"
                  placeholderTextColor={designColors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={designColors.textMuted} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={designColors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
              </View>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={designColors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {activeTab === 'register' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={designColors.textMuted} style={styles.inputIcon} />
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={designColors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                  />
                </View>
              </View>
            )}

            {activeTab === 'login' && (
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={12} color={designColors.white} />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={activeTab === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={designColors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {activeTab === 'login' ? 'Login' : 'Register'}
                </Text>
              )}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.white
  },
  darkHeader: {
    backgroundColor: designColors.dark,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: designColors.white,
    lineHeight: 36,
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 14,
    color: designColors.textMuted,
    lineHeight: 20
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: designColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: designColors.lightGray,
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
    position: 'relative'
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    width: '50%',
    height: '100%',
    backgroundColor: designColors.white,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: designColors.textMuted
  },
  tabTextActive: {
    color: designColors.textPrimary,
    fontWeight: '600'
  },
  form: {
    gap: 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designColors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designColors.border,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  inputIcon: {
    marginRight: 12
  },
  inputWrapper: {
    flex: 1,
    paddingVertical: 8
  },
  inputLabel: {
    fontSize: 11,
    color: designColors.textMuted,
    marginBottom: 2
  },
  input: {
    fontSize: 15,
    color: designColors.textPrimary,
    padding: 0,
    height: 24
  },
  eyeButton: {
    padding: 8
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: designColors.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: designColors.accent,
    borderColor: designColors.accent
  },
  rememberText: {
    fontSize: 13,
    color: designColors.textSecondary
  },
  forgotText: {
    fontSize: 13,
    color: designColors.accent,
    fontWeight: '500'
  },
  submitButton: {
    backgroundColor: designColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: designColors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: designColors.border
  },
  dividerText: {
    fontSize: 13,
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
    fontWeight: '500',
    color: designColors.textPrimary
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: designColors.dark,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8
  }
});
