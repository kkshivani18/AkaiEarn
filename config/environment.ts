/** Environment Configuration */
export type Environment = 'development' | 'staging' | 'production';

// Environment configuration interface
interface EnvironmentConfig {
  API_BASE_URL: string;
  ENVIRONMENT: Environment;
  DEBUG: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  APP_NAME: string;
  APP_VERSION: string;
}

// Get current environment from Expo constants
const getCurrentEnvironment = (): Environment => {
  // Check if we're in development mode
  if (__DEV__) {
    return 'development';
  }
  
  // You can add more sophisticated environment detection here
  // For example, checking for specific build variants or environment variables
  return 'production';
};

// Environment-specific configurations
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    API_BASE_URL: 'https://offer-wall-backend-ten.vercel.app/api',
    ENVIRONMENT: 'development',
    DEBUG: true,
    LOG_LEVEL: 'debug',
    APP_NAME: 'OfferWall Dev',
    APP_VERSION: '1.0.0',
  },
  staging: {
    API_BASE_URL: 'https://staging.your-domain.com/api',
    ENVIRONMENT: 'staging',
    DEBUG: true,
    LOG_LEVEL: 'info',
    APP_NAME: 'OfferWall Staging',
    APP_VERSION: '1.0.0',
  },
  production: {
    API_BASE_URL: 'https://your-production-domain.com/api',
    ENVIRONMENT: 'production',
    DEBUG: false,
    LOG_LEVEL: 'error',
    APP_NAME: 'OfferWall',
    APP_VERSION: '1.0.0',
  },
};

// Get current configuration
const currentEnvironment = getCurrentEnvironment();
export const config: EnvironmentConfig = environments[currentEnvironment];

// Export individual config values for convenience
export const {
  API_BASE_URL,
  ENVIRONMENT,
  DEBUG,
  LOG_LEVEL,
  APP_NAME,
  APP_VERSION,
} = config;

// Utility functions
export const isDevelopment = (): boolean => ENVIRONMENT === 'development';
export const isStaging = (): boolean => ENVIRONMENT === 'staging';
export const isProduction = (): boolean => ENVIRONMENT === 'production';

// Logging utility
export const log = {
  debug: (...args: any[]) => {
    if (DEBUG && LOG_LEVEL === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (LOG_LEVEL === 'warn' || LOG_LEVEL === 'info' || LOG_LEVEL === 'debug') {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

// Export configuration for debugging
if (DEBUG) {
  console.log('🔧 Environment Configuration:', {
    environment: ENVIRONMENT,
    apiBaseUrl: API_BASE_URL,
    debug: DEBUG,
    logLevel: LOG_LEVEL,
  });
}