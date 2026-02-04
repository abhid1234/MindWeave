/**
 * Mindweave Mobile App - Capacitor Bridge
 *
 * This file initializes native plugins and handles communication
 * between the native layer and the web app.
 */

import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { Share } from '@capacitor/share';

/**
 * Initialize the mobile app
 */
async function initializeApp(): Promise<void> {
  console.log('[Mindweave] Initializing mobile app...');

  // Set up status bar
  await setupStatusBar();

  // Set up push notifications
  await setupPushNotifications();

  // Set up app lifecycle handlers
  setupAppLifecycle();

  // Set up deep link handling
  setupDeepLinks();

  // Hide splash screen after initialization
  await SplashScreen.hide();

  console.log('[Mindweave] Mobile app initialized');
}

/**
 * Configure the status bar appearance
 */
async function setupStatusBar(): Promise<void> {
  try {
    // Set status bar style (light content for dark status bar)
    await StatusBar.setStyle({ style: Style.Light });

    // Set status bar background color (matches app theme)
    await StatusBar.setBackgroundColor({ color: '#6366f1' });

    console.log('[Mindweave] Status bar configured');
  } catch (error) {
    // Status bar may not be available on all platforms
    console.warn('[Mindweave] Status bar configuration skipped:', error);
  }
}

/**
 * Set up push notifications
 */
async function setupPushNotifications(): Promise<void> {
  try {
    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();
    console.log('[Mindweave] Push notification permission status:', permStatus.receive);

    if (permStatus.receive === 'prompt') {
      // Request permission
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== 'granted') {
        console.log('[Mindweave] Push notification permission denied');
        return;
      }
    } else if (permStatus.receive !== 'granted') {
      console.log('[Mindweave] Push notification permission not granted');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Mindweave] Push registration token:', token.value);

      // Send token to backend for storage
      await registerDeviceToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Mindweave] Push registration error:', error);
    });

    // Listen for incoming notifications (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Mindweave] Push notification received:', notification);
      // The web app will handle displaying in-app notifications
    });

    // Listen for notification actions (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Mindweave] Push notification action:', action);
      // Handle notification tap - navigate to relevant content
      handleNotificationAction(action.notification.data);
    });

    console.log('[Mindweave] Push notifications configured');
  } catch (error) {
    console.warn('[Mindweave] Push notifications not available:', error);
  }
}

/**
 * Register device token with backend
 */
async function registerDeviceToken(token: string): Promise<void> {
  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        token,
        platform: getPlatform(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register device: ${response.status}`);
    }

    console.log('[Mindweave] Device token registered successfully');
  } catch (error) {
    console.error('[Mindweave] Failed to register device token:', error);
  }
}

/**
 * Handle notification tap action
 */
function handleNotificationAction(data: Record<string, unknown>): void {
  // Navigate to content based on notification data
  if (data.contentId) {
    const serverUrl = getServerUrl();
    window.location.href = `${serverUrl}/dashboard/library?id=${data.contentId}`;
  } else if (data.url) {
    window.location.href = data.url as string;
  }
}

/**
 * Set up app lifecycle handlers
 */
function setupAppLifecycle(): void {
  // Handle app state changes
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('[Mindweave] App state changed, active:', isActive);

    if (isActive) {
      // App came to foreground - refresh content if needed
      window.dispatchEvent(new CustomEvent('mindweave:app-resume'));
    } else {
      // App went to background
      window.dispatchEvent(new CustomEvent('mindweave:app-pause'));
    }
  });

  // Handle back button (Android)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // Show exit confirmation or minimize app
      App.minimizeApp();
    }
  });

  console.log('[Mindweave] App lifecycle handlers configured');
}

/**
 * Set up deep link handling
 */
function setupDeepLinks(): void {
  // Handle deep links when app is opened via URL
  App.addListener('appUrlOpen', ({ url }) => {
    console.log('[Mindweave] App opened via URL:', url);
    handleDeepLink(url);
  });

  // Check if app was launched with a URL
  App.getLaunchUrl().then((result) => {
    if (result?.url) {
      console.log('[Mindweave] App launched with URL:', result.url);
      handleDeepLink(result.url);
    }
  });

  console.log('[Mindweave] Deep link handlers configured');
}

/**
 * Handle deep link navigation
 */
function handleDeepLink(url: string): void {
  try {
    const parsedUrl = new URL(url);
    const serverUrl = getServerUrl();

    // Handle mindweave:// protocol
    if (parsedUrl.protocol === 'mindweave:') {
      const path = parsedUrl.pathname || parsedUrl.hostname;
      window.location.href = `${serverUrl}/${path}${parsedUrl.search}`;
      return;
    }

    // Handle https://mindweave.space/* URLs (Universal Links)
    if (parsedUrl.hostname.includes('mindweave')) {
      window.location.href = `${serverUrl}${parsedUrl.pathname}${parsedUrl.search}`;
      return;
    }

    console.log('[Mindweave] Unhandled deep link:', url);
  } catch (error) {
    console.error('[Mindweave] Error handling deep link:', error);
  }
}

/**
 * Get the server URL from environment or default
 */
function getServerUrl(): string {
  // In production, this would be the deployed URL
  // For development, you can override via environment
  return 'https://mindweave.space';
}

/**
 * Get the current platform
 */
function getPlatform(): 'ios' | 'android' | 'web' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  if (/android/.test(userAgent)) {
    return 'android';
  }
  return 'web';
}

/**
 * Share content using native share dialog
 */
export async function shareContent(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  try {
    const result = await Share.share({
      title: options.title,
      text: options.text,
      url: options.url,
      dialogTitle: 'Share via',
    });

    return result.activityType !== undefined;
  } catch (error) {
    console.error('[Mindweave] Share failed:', error);
    return false;
  }
}

// Expose functions to the web app via window object
declare global {
  interface Window {
    MindweaveMobile: {
      shareContent: typeof shareContent;
      isNativeApp: boolean;
      platform: 'ios' | 'android' | 'web';
    };
  }
}

window.MindweaveMobile = {
  shareContent,
  isNativeApp: true,
  platform: getPlatform(),
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
