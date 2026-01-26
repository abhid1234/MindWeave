# Mindweave Mobile App

Native mobile application wrapper for Mindweave using Capacitor.

## Overview

This is a hybrid mobile app that wraps the Mindweave PWA in a native shell, providing:

- Native app store distribution (iOS App Store, Google Play)
- Push notifications
- Native share functionality
- Deep linking support
- Status bar customization

## Prerequisites

- Node.js 20+
- For iOS: macOS with Xcode 15+
- For Android: Android Studio with SDK 34+

## Setup

1. Install dependencies:

```bash
cd apps/mobile
npm install
```

2. Build the project:

```bash
npm run build
```

3. Add native platforms:

```bash
npm run add:ios     # For iOS
npm run add:android # For Android
```

## Development

### Running on iOS

```bash
npm run ios:build
npm run ios
```

This will open Xcode where you can run the app on a simulator or device.

### Running on Android

```bash
npm run android:build
npm run android
```

This will open Android Studio where you can run the app on an emulator or device.

### Live Reload Development

For development with live reload:

```bash
# Android
npm run live

# iOS
npm run live:ios
```

## Configuration

### Server URL

The app loads Mindweave from a remote URL. Configure this in `capacitor.config.ts`:

```typescript
server: {
  url: 'https://mindweave.app', // Production URL
  // url: 'http://localhost:3000', // Development URL
}
```

### Environment Variables

- `CAPACITOR_SERVER_URL`: Override the server URL

## Native Features

### Push Notifications

Push notifications are configured to work with:
- Firebase Cloud Messaging (Android)
- Apple Push Notification service (iOS)

The device token is sent to `/api/devices` on the backend.

### Deep Linking

The app handles:
- `mindweave://` custom URL scheme
- `https://mindweave.app/*` universal links

### Share Intent

On Android, the app can receive shared content from other apps.

## Building for Release

### Android

1. Generate a keystore (first time only):

```bash
keytool -genkey -v -keystore mindweave-release.keystore -alias mindweave -keyalg RSA -keysize 2048 -validity 10000
```

2. Build release APK/AAB:

```bash
npm run android:build
# Then build in Android Studio: Build > Generate Signed Bundle/APK
```

### iOS

1. Configure signing in Xcode with your Apple Developer account
2. Build for release: Product > Archive

## Project Structure

```
apps/mobile/
├── android/           # Android native project (generated)
├── ios/               # iOS native project (generated)
├── dist/              # Built web assets
├── resources/         # App icons and splash screens
├── src/
│   ├── index.html     # Loading screen HTML
│   └── js/
│       └── app.ts     # Capacitor bridge code
├── capacitor.config.ts
├── package.json
└── tsconfig.json
```

## Troubleshooting

### iOS Build Issues

- Ensure Xcode is up to date
- Run `pod install` in the `ios/App` directory
- Check provisioning profiles are valid

### Android Build Issues

- Ensure Android SDK 34 is installed
- Sync Gradle files in Android Studio
- Check `local.properties` has correct SDK path

### Network Issues

- Ensure the server URL is accessible
- For local development, use your machine's IP instead of localhost
- Check CORS settings on the backend
