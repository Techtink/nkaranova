import Constants from 'expo-constants';

// Environment detection
const getEnvironment = () => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel || 'development';

  if (releaseChannel === 'production') return 'production';
  if (releaseChannel === 'staging') return 'staging';
  return 'development';
};

// Local development IP - update this to your Mac's IP address
const LOCAL_IP = '192.168.1.249';

// Digital Ocean production server for images
const DO_SERVER = 'http://167.71.82.139';

// OpenWeatherMap API Key - Get yours free at https://openweathermap.org/api
const OPENWEATHER_API_KEY = '4b3e9af5a8bccd5e187e12364541063f';

// Environment-specific configurations
const ENV = {
  development: {
    apiUrl: `http://${LOCAL_IP}:6005/api`,
    socketUrl: `http://${LOCAL_IP}:6005`,
    imageBaseUrl: DO_SERVER, // Fetch images from Digital Ocean
    enableDebugLogs: true,
    appName: 'Tailor Connect (Dev)'
  },
  staging: {
    apiUrl: 'https://staging-api.tailorconnect.com/api',
    socketUrl: 'https://staging-api.tailorconnect.com',
    imageBaseUrl: 'https://staging-api.tailorconnect.com',
    enableDebugLogs: true,
    appName: 'Tailor Connect (Staging)'
  },
  production: {
    apiUrl: 'https://api.tailorconnect.com/api',
    socketUrl: 'https://api.tailorconnect.com',
    imageBaseUrl: 'https://api.tailorconnect.com',
    enableDebugLogs: false,
    appName: 'Tailor Connect'
  }
};

const currentEnv = getEnvironment();

export const config = {
  ...ENV[currentEnv],
  environment: currentEnv,
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
  openWeatherApiKey: OPENWEATHER_API_KEY
};

export default config;
