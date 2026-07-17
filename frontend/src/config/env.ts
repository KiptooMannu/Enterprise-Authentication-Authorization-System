// Environment configuration
// This file centralizes all environment variable access

import { environments } from './enviroments'

export const config = {
  apiBaseUrl: environments.apiBaseUrl,
  oauthBaseUrl: import.meta.env.VITE_OAUTH_BASE_URL || 'https://enterprise-authentication-authorization.onrender.com',

  // OAuth Configuration
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',

  // Application Configuration
  appName: import.meta.env.VITE_APP_NAME || 'AuthCore',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Supabase Configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Feature Flags
  enableOAuth: !!import.meta.env.VITE_GOOGLE_CLIENT_ID || !!import.meta.env.VITE_GITHUB_CLIENT_ID,
  enableMFA: true,
  enableDeviceFingerprinting: true,
  enableGeolocationTracking: true,
}

export default config
