import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { settingsAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

// Design colors
const designColors = {
  dark: '#1a1a1a',
  accent: '#5c8d6a',
  accentLight: '#6b9e7a',
  white: '#ffffff',
  textMuted: 'rgba(255,255,255,0.7)'
};

// Default placeholder image - you can replace this with your own image
const DEFAULT_BG_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';

// Default content
const DEFAULT_HEADLINE = {
  customer: 'Find Your Perfect\nTailor Today',
  tailor: 'Grow Your\nTailoring Business'
};

const DEFAULT_SUBHEADLINE = {
  customer: 'Discover skilled tailors near you. Book appointments, get custom fits, and look your best.',
  tailor: 'Manage your tailoring business, connect with customers, and grow your brand.'
};

export default function OnboardingScreen({
  navigation,
  appName = 'Tailor Connect',
  appType = 'customer',
  backgroundImage
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch mobile settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getMobileSettings();
        if (response.data?.success && response.data?.data) {
          // Convert settings array to object for easier access
          const settingsObj = {};
          Object.entries(response.data.data).forEach(([key, data]) => {
            settingsObj[key] = data.value;
          });
          setSettings(settingsObj);
        }
      } catch (error) {
        console.log('Failed to fetch mobile settings, using defaults:', error.message);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 300,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Auth');
  };

  // Get settings-based values with fallbacks
  const getSettingValue = (key, defaultValue) => {
    return settings?.[key] || defaultValue;
  };

  // Determine background image source
  const getSplashImage = () => {
    // First check if a backgroundImage prop was passed
    if (backgroundImage) {
      return typeof backgroundImage === 'string' ? { uri: backgroundImage } : backgroundImage;
    }
    // Then check settings based on app type
    const settingsKey = appType === 'tailor' ? 'mobile_tailor_splash_image' : 'mobile_customer_splash_image';
    const settingsImage = settings?.[settingsKey];
    if (settingsImage) {
      return { uri: settingsImage };
    }
    // Fall back to default
    return { uri: DEFAULT_BG_IMAGE };
  };

  // Get headline and subheadline from settings or defaults
  const getHeadline = () => {
    const settingsKey = appType === 'tailor' ? 'mobile_tailor_splash_headline' : 'mobile_customer_splash_headline';
    return settings?.[settingsKey] || DEFAULT_HEADLINE[appType];
  };

  const getSubheadline = () => {
    const settingsKey = appType === 'tailor' ? 'mobile_tailor_splash_subheadline' : 'mobile_customer_splash_subheadline';
    return settings?.[settingsKey] || DEFAULT_SUBHEADLINE[appType];
  };

  // Get app name from settings or prop
  const displayAppName = settings?.mobile_app_name || appName;

  const bgSource = getSplashImage();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full Screen Background Image */}
      <ImageBackground
        source={bgSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Gradient Overlay - darker at bottom */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.2)',
            'rgba(0,0,0,0.3)',
            'rgba(0,0,0,0.5)',
            'rgba(0,0,0,0.7)',
            'rgba(0,0,0,0.85)',
            'rgba(0,0,0,0.95)'
          ]}
          locations={[0, 0.2, 0.4, 0.6, 0.75, 1]}
          style={styles.gradientOverlay}
        >
          {/* Spacer to push content to bottom */}
          <View style={styles.spacer} />

          {/* Bottom Content */}
          <Animated.View
            style={[
              styles.bottomContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Logo - positioned just above headline in the dark area */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="cut-outline" size={24} color={designColors.white} />
              </View>
              <Text style={styles.logoText}>{displayAppName.toLowerCase().replace(' ', '')}</Text>
            </View>

            <Text style={styles.headline}>
              {getHeadline()}
            </Text>
            <Text style={styles.subheadline}>
              {getSubheadline()}
            </Text>

            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={designColors.white} />
            </TouchableOpacity>

            {/* Already have account link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleGetStarted}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.dark
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  gradientOverlay: {
    flex: 1,
    paddingTop: 60
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: designColors.white,
    letterSpacing: 0.5
  },
  spacer: {
    flex: 1
  },
  bottomContent: {
    paddingHorizontal: 24,
    paddingBottom: 20
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: designColors.white,
    lineHeight: 46,
    marginBottom: 16
  },
  subheadline: {
    fontSize: 16,
    color: designColors.textMuted,
    lineHeight: 24,
    marginBottom: 32
  },
  getStartedButton: {
    backgroundColor: designColors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  getStartedText: {
    color: designColors.white,
    fontSize: 17,
    fontWeight: '600'
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20
  },
  loginLinkText: {
    fontSize: 14,
    color: designColors.textMuted
  },
  loginLinkBold: {
    color: designColors.white,
    fontWeight: '600'
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 16
  }
});
