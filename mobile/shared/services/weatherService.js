import * as Location from 'expo-location';
import config from '../config/env';

// OpenWeatherMap API configuration
// You'll need to add your API key to the env config
const OPENWEATHER_API_KEY = config.openWeatherApiKey || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache weather data for 30 minutes
let weatherCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Request location permissions
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current device location
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error) {
    console.log('Error getting location:', error);
    return null;
  }
};

/**
 * Fetch weather data from OpenWeatherMap
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object | null>}
 */
export const fetchWeatherData = async (latitude, longitude) => {
  if (!OPENWEATHER_API_KEY) {
    console.log('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      weatherId: data.weather[0].id,
      weatherMain: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      clouds: data.clouds.all,
      sunrise: data.sys.sunrise * 1000, // Convert to milliseconds
      sunset: data.sys.sunset * 1000,
      timezone: data.timezone,
      cityName: data.name,
      countryCode: data.sys.country
    };
  } catch (error) {
    console.log('Error fetching weather:', error);
    return null;
  }
};

/**
 * Get current weather for user's location (with caching)
 * @param {boolean} forceRefresh - Force a new API call
 * @returns {Promise<Object | null>}
 */
export const getWeatherForCurrentLocation = async (forceRefresh = false) => {
  // Check cache first
  if (!forceRefresh && weatherCache && lastFetchTime) {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      return weatherCache;
    }
  }

  const location = await getCurrentLocation();
  if (!location) {
    return null;
  }

  const weather = await fetchWeatherData(location.latitude, location.longitude);
  if (weather) {
    weatherCache = weather;
    lastFetchTime = Date.now();
  }

  return weather;
};

/**
 * Get weather by city name (fallback option)
 * @param {string} cityName
 * @returns {Promise<Object | null>}
 */
export const getWeatherByCity = async (cityName) => {
  if (!OPENWEATHER_API_KEY) {
    console.log('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const url = `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      weatherId: data.weather[0].id,
      weatherMain: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      clouds: data.clouds.all,
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000,
      timezone: data.timezone,
      cityName: data.name,
      countryCode: data.sys.country
    };
  } catch (error) {
    console.log('Error fetching weather by city:', error);
    return null;
  }
};

/**
 * Check if it's currently daytime based on weather data
 * @param {Object} weather - Weather data object
 * @returns {boolean}
 */
export const isDaytime = (weather) => {
  if (!weather) return true; // Default to daytime
  const now = Date.now();
  return now >= weather.sunrise && now <= weather.sunset;
};

/**
 * Get a mock weather for testing/development
 * @param {string} condition - 'clear', 'rain', 'snow', 'clouds', 'thunderstorm'
 * @returns {Object}
 */
export const getMockWeather = (condition = 'clear') => {
  const conditions = {
    clear: { weatherId: 800, weatherMain: 'Clear' },
    clouds: { weatherId: 803, weatherMain: 'Clouds' },
    rain: { weatherId: 501, weatherMain: 'Rain' },
    drizzle: { weatherId: 300, weatherMain: 'Drizzle' },
    thunderstorm: { weatherId: 211, weatherMain: 'Thunderstorm' },
    snow: { weatherId: 601, weatherMain: 'Snow' },
    mist: { weatherId: 701, weatherMain: 'Mist' }
  };

  const now = Date.now();
  const mockSunrise = new Date().setHours(6, 0, 0, 0);
  const mockSunset = new Date().setHours(19, 0, 0, 0);

  return {
    ...conditions[condition] || conditions.clear,
    weatherDescription: condition,
    temperature: 22,
    feelsLike: 21,
    humidity: 60,
    windSpeed: 5,
    clouds: condition === 'clouds' ? 80 : 20,
    sunrise: mockSunrise,
    sunset: mockSunset,
    timezone: 0,
    cityName: 'Test City',
    countryCode: 'TC'
  };
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  fetchWeatherData,
  getWeatherForCurrentLocation,
  getWeatherByCity,
  isDaytime,
  getMockWeather
};
