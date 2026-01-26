import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindweave.app',
  appName: 'Mindweave',
  webDir: 'dist',

  // Server configuration - loads the remote web app
  server: {
    // For production, use the deployed URL
    // For development, use localhost or your dev server URL
    url: process.env.CAPACITOR_SERVER_URL || 'https://mindweave.app',
    cleartext: false,
    // Allow navigation to external URLs (for OAuth flows)
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'mindweave.app',
      '*.mindweave.app',
    ],
  },

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6366f1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#6366f1',
    },
  },

  // iOS-specific configuration
  ios: {
    scheme: 'Mindweave',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // For debugging
    // loggingBehavior: 'debug',
  },

  // Android-specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // For debugging, set to true
    // webContentsDebuggingEnabled: true,
  },
};

export default config;
