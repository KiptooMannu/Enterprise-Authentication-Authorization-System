// Environment configuration
// This file centralizes all environment variable access

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // OAuth Configuration
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  
  // Application Configuration
  appName: import.meta.env.VITE_APP_NAME || 'AuthCore',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  enableOAuth: !!import.meta.env.VITE_GOOGLE_CLIENT_ID || !!import.meta.env.VITE_GITHUB_CLIENT_ID,
  enableMFA: true,
  enableDeviceFingerprinting: true,
  enableGeolocationTracking: true,
}

export default config
