import Constants from 'expo-constants';

// Environment detection
const getEnvironment = () => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel || 'development';

  if (releaseChannel === 'production') return 'production';
  if (releaseChannel === 'staging') return 'staging';
  return 'development';
};

// Environment-specific configurations
const ENV = {
  development: {
    apiUrl: 'http://localhost:5001/api',
    socketUrl: 'http://localhost:5001',
    imageBaseUrl: 'http://localhost:5001',
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
  buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1'
};

export default config;
