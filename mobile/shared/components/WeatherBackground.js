import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Weather condition mappings from OpenWeatherMap
const WEATHER_TYPES = {
  CLEAR: 'clear',
  CLOUDS: 'clouds',
  RAIN: 'rain',
  DRIZZLE: 'drizzle',
  THUNDERSTORM: 'thunderstorm',
  SNOW: 'snow',
  MIST: 'mist'
};

// Time periods
const TIME_PERIODS = {
  DAWN: 'dawn',      // 5-7am
  MORNING: 'morning', // 7-12pm
  AFTERNOON: 'afternoon', // 12-5pm
  SUNSET: 'sunset',  // 5-7pm
  EVENING: 'evening', // 7-9pm
  NIGHT: 'night'     // 9pm-5am
};

// Sky gradient colors based on time of day
const SKY_GRADIENTS = {
  [TIME_PERIODS.DAWN]: ['#1a1a2e', '#2d3561', '#6b5b95', '#e8b4b8'],
  [TIME_PERIODS.MORNING]: ['#87CEEB', '#98D8E8', '#B0E0E6', '#E0F7FA'],
  [TIME_PERIODS.AFTERNOON]: ['#4A90D9', '#6BB3F0', '#87CEEB', '#B0E0E6'],
  [TIME_PERIODS.SUNSET]: ['#1a1a2e', '#4a2c4c', '#cc5f5f', '#f4a460', '#ffd700'],
  [TIME_PERIODS.EVENING]: ['#0f0c29', '#1a1a2e', '#302b63', '#544a7d'],
  [TIME_PERIODS.NIGHT]: ['#0a0a15', '#0f0c29', '#1a1a2e', '#24243e']
};

// Weather overlay colors
const WEATHER_OVERLAYS = {
  [WEATHER_TYPES.CLEAR]: 'transparent',
  [WEATHER_TYPES.CLOUDS]: 'rgba(150, 150, 150, 0.2)',
  [WEATHER_TYPES.RAIN]: 'rgba(100, 100, 120, 0.3)',
  [WEATHER_TYPES.THUNDERSTORM]: 'rgba(50, 50, 70, 0.4)',
  [WEATHER_TYPES.SNOW]: 'rgba(200, 210, 220, 0.2)',
  [WEATHER_TYPES.MIST]: 'rgba(180, 180, 190, 0.4)'
};

// Get time period from hour
const getTimePeriod = (hour) => {
  if (hour >= 5 && hour < 7) return TIME_PERIODS.DAWN;
  if (hour >= 7 && hour < 12) return TIME_PERIODS.MORNING;
  if (hour >= 12 && hour < 17) return TIME_PERIODS.AFTERNOON;
  if (hour >= 17 && hour < 19) return TIME_PERIODS.SUNSET;
  if (hour >= 19 && hour < 21) return TIME_PERIODS.EVENING;
  return TIME_PERIODS.NIGHT;
};

// Map OpenWeatherMap condition to our weather type
const mapWeatherCondition = (weatherId) => {
  if (weatherId >= 200 && weatherId < 300) return WEATHER_TYPES.THUNDERSTORM;
  if (weatherId >= 300 && weatherId < 400) return WEATHER_TYPES.DRIZZLE;
  if (weatherId >= 500 && weatherId < 600) return WEATHER_TYPES.RAIN;
  if (weatherId >= 600 && weatherId < 700) return WEATHER_TYPES.SNOW;
  if (weatherId >= 700 && weatherId < 800) return WEATHER_TYPES.MIST;
  if (weatherId === 800) return WEATHER_TYPES.CLEAR;
  if (weatherId > 800) return WEATHER_TYPES.CLOUDS;
  return WEATHER_TYPES.CLEAR;
};

// Rain Drop Component
const RainDrop = ({ delay, duration, startX }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-20);
      opacity.setValue(0.7);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: duration * 0.1,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: duration * 0.9,
            useNativeDriver: true
          })
        ])
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        {
          left: startX,
          opacity,
          transform: [{ translateY }]
        }
      ]}
    />
  );
};

// Snow Flake Component
const SnowFlake = ({ delay, duration, startX, size }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-20);
      translateX.setValue(0);
      opacity.setValue(0);
      rotation.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 30,
            duration: duration / 4,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(translateX, {
            toValue: -30,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: duration * 0.2,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: duration * 0.8,
            useNativeDriver: true
          })
        ]),
        Animated.timing(rotation, {
          toValue: 360,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={[
        styles.snowFlake,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin }
          ]
        }
      ]}
    />
  );
};

// Cloud Component
const Cloud = ({ startX, startY, size, speed, opacity: cloudOpacity }) => {
  const translateX = useRef(new Animated.Value(startX)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-size * 2);
      Animated.timing(translateX, {
        toValue: width + size,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true
      }).start(() => animate());
    };

    const timeout = setTimeout(animate, Math.random() * speed);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          top: startY,
          width: size,
          height: size * 0.6,
          opacity: cloudOpacity,
          transform: [{ translateX }]
        }
      ]}
    >
      <View style={[styles.cloudPart, { width: size * 0.5, height: size * 0.5, left: 0, bottom: 0 }]} />
      <View style={[styles.cloudPart, { width: size * 0.7, height: size * 0.7, left: size * 0.25, bottom: size * 0.1 }]} />
      <View style={[styles.cloudPart, { width: size * 0.5, height: size * 0.5, right: 0, bottom: 0 }]} />
    </Animated.View>
  );
};

// Sun/Moon Component
const CelestialBody = ({ timePeriod }) => {
  const isNight = [TIME_PERIODS.NIGHT, TIME_PERIODS.EVENING].includes(timePeriod);
  const isSunset = timePeriod === TIME_PERIODS.SUNSET;
  const isDawn = timePeriod === TIME_PERIODS.DAWN;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 3000,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  if (isNight) {
    // Moon
    return (
      <Animated.View
        style={[
          styles.moon,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Animated.View style={[styles.moonGlow, { opacity: glowAnim }]} />
        <View style={styles.moonCrater1} />
        <View style={styles.moonCrater2} />
      </Animated.View>
    );
  }

  // Sun
  const sunColor = isSunset || isDawn ? '#FF6B35' : '#FFD700';
  return (
    <Animated.View
      style={[
        styles.sun,
        { backgroundColor: sunColor, transform: [{ scale: pulseAnim }] }
      ]}
    >
      <Animated.View
        style={[
          styles.sunGlow,
          { backgroundColor: sunColor, opacity: glowAnim }
        ]}
      />
    </Animated.View>
  );
};

// Stars Component (for night)
const Stars = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * (height * 0.4),
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2000
    }));
  }, []);

  return (
    <>
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </>
  );
};

const Star = ({ x, y, size, delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity
        }
      ]}
    />
  );
};

// Lightning Flash Component
const LightningFlash = () => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flash = () => {
      const delay = Math.random() * 8000 + 4000; // Random 4-12 seconds

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.8, duration: 50, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 50, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true })
        ]).start(() => flash());
      }, delay);
    };

    flash();
  }, []);

  return (
    <Animated.View
      style={[
        styles.lightningFlash,
        { opacity }
      ]}
    />
  );
};

export default function WeatherBackground({
  weatherCondition = WEATHER_TYPES.CLEAR,
  weatherId = 800,
  style,
  containerHeight = 250
}) {
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS.AFTERNOON);

  // Update time period
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      setTimePeriod(getTimePeriod(hour));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Determine weather type
  const weather = weatherId ? mapWeatherCondition(weatherId) : weatherCondition;

  // Generate particles based on weather
  const rainDrops = useMemo(() => {
    if (weather !== WEATHER_TYPES.RAIN && weather !== WEATHER_TYPES.DRIZZLE && weather !== WEATHER_TYPES.THUNDERSTORM) {
      return [];
    }
    const count = weather === WEATHER_TYPES.DRIZZLE ? 30 : 60;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 2000,
      duration: Math.random() * 1000 + 1500,
      startX: Math.random() * width
    }));
  }, [weather]);

  const snowFlakes = useMemo(() => {
    if (weather !== WEATHER_TYPES.SNOW) return [];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3000,
      duration: Math.random() * 3000 + 4000,
      startX: Math.random() * width,
      size: Math.random() * 6 + 4
    }));
  }, [weather]);

  const clouds = useMemo(() => {
    if (weather === WEATHER_TYPES.CLEAR) return [];
    const count = weather === WEATHER_TYPES.CLOUDS ? 4 : 2;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: Math.random() * width,
      startY: Math.random() * 60 + 30,
      size: Math.random() * 80 + 60,
      speed: Math.random() * 30000 + 40000,
      opacity: weather === WEATHER_TYPES.CLOUDS ? 0.6 : 0.3
    }));
  }, [weather]);

  const isNight = [TIME_PERIODS.NIGHT, TIME_PERIODS.EVENING].includes(timePeriod);
  const showLightning = weather === WEATHER_TYPES.THUNDERSTORM;

  return (
    <View style={[styles.container, { height: containerHeight }, style]}>
      {/* Sky Gradient */}
      <LinearGradient
        colors={SKY_GRADIENTS[timePeriod]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Weather Overlay */}
      <View
        style={[
          styles.weatherOverlay,
          { backgroundColor: WEATHER_OVERLAYS[weather] }
        ]}
      />

      {/* Stars (night only) */}
      {isNight && weather === WEATHER_TYPES.CLEAR && <Stars />}

      {/* Sun/Moon */}
      {weather === WEATHER_TYPES.CLEAR && <CelestialBody timePeriod={timePeriod} />}

      {/* Clouds */}
      {clouds.map((cloud) => (
        <Cloud key={cloud.id} {...cloud} />
      ))}

      {/* Rain */}
      {rainDrops.map((drop) => (
        <RainDrop key={drop.id} {...drop} />
      ))}

      {/* Snow */}
      {snowFlakes.map((flake) => (
        <SnowFlake key={flake.id} {...flake} />
      ))}

      {/* Lightning */}
      {showLightning && <LightningFlash />}
    </View>
  );
}

// Export utilities
export { WEATHER_TYPES, TIME_PERIODS, mapWeatherCondition, getTimePeriod };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden'
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  weatherOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  rainDrop: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(174, 194, 224, 0.6)',
    borderRadius: 1
  },
  snowFlake: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },
  cloud: {
    position: 'absolute'
  },
  cloudPart: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 50
  },
  sun: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 50,
    height: 50,
    borderRadius: 25
  },
  sunGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 70,
    height: 70,
    borderRadius: 35
  },
  moon: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#F5F5DC'
  },
  moonGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 61,
    height: 61,
    borderRadius: 35,
    backgroundColor: 'rgba(245, 245, 220, 0.3)'
  },
  moonCrater1: {
    position: 'absolute',
    top: 10,
    left: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)'
  },
  moonCrater2: {
    position: 'absolute',
    bottom: 12,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)'
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF'
  },
  lightningFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 1)'
  }
});
