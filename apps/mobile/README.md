# Mindweave Mobile App

Native mobile application wrapper for Mindweave using Capacitor.

## Overview

This is a hybrid mobile app that wraps the Mindweave PWA in a native shell, providing:

- Native app store distribution (iOS App Store, Google Play)
- Push notifications
- Native share functionality
- Deep linking support
- Status bar customization

## Quick Start

### Automated Builds (Recommended)

The easiest way to build the mobile app is using GitHub Actions:

1. Go to **Actions** tab in GitHub
2. Select **Mobile Build** workflow
3. Click **Run workflow**
4. Choose options (Android/iOS, Debug/Release)
5. Download the built APK/IPA from artifacts

### Manual Builds

See detailed instructions below.

## Prerequisites

- Node.js 20+
- For iOS: macOS with Xcode 15+
- For Android: Android Studio with SDK 34+ and Java 17+

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

## CI/CD Builds

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/mobile-build.yml`) that:

1. **Prepares assets**: Builds TypeScript and generates icons
2. **Builds Android**: Creates debug or release APK
3. **Builds iOS**: Creates simulator build or release IPA
4. **Creates releases**: Drafts GitHub releases with artifacts

### Triggering Builds

Builds are automatically triggered when:
- Changes are pushed to `apps/mobile/` on `main` branch
- Pull requests modify mobile app files

Manual builds can be triggered via workflow dispatch with options:
- `build_android`: Build Android APK
- `build_ios`: Build iOS app
- `release`: Create signed release builds

### Required Secrets for Release Builds

#### Android
| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias in keystore |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file |

#### iOS
| Secret | Description |
|--------|-------------|
| `IOS_CODE_SIGN_IDENTITY` | Code signing identity |
| `IOS_DEVELOPMENT_TEAM` | Apple Developer Team ID |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded provisioning profile |
| `IOS_CERTIFICATE_BASE64` | Base64-encoded signing certificate |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password |

### Setting Up Release Signing

#### Android Keystore

```bash
# Generate a new keystore
keytool -genkey -v \
  -keystore mindweave-release.keystore \
  -alias mindweave \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Encode for GitHub Secrets
base64 -i mindweave-release.keystore | pbcopy
```

#### iOS Certificates

1. Create an App ID in Apple Developer Portal
2. Create a distribution certificate
3. Create a provisioning profile
4. Export and encode for GitHub Secrets

## App Store Submission

### Google Play Store

1. Build release APK: `./gradlew bundleRelease` (AAB format)
2. Create app in Google Play Console
3. Upload AAB to production track
4. Fill in store listing, content rating, pricing
5. Submit for review

### Apple App Store

1. Build and archive in Xcode
2. Upload to App Store Connect via Transporter
3. Fill in app metadata, screenshots
4. Submit for review

## Version Management

Update version in these files for new releases:

1. `apps/mobile/package.json` - `version` field
2. `apps/mobile/android/app/build.gradle` - `versionCode` and `versionName`
3. `apps/mobile/ios/App/App.xcodeproj/project.pbxproj` - `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`

## Environment Configuration

### Development vs Production

Set the server URL in `capacitor.config.ts`:

```typescript
server: {
  // Development
  url: 'http://192.168.1.100:3000',

  // Production
  url: 'https://mindweave.app',
}
```

Or use environment variable:
```bash
CAPACITOR_SERVER_URL=http://localhost:3000 npm run ios:build
```

### Feature Flags

The web app detects native environment via:
```javascript
if (window.MindweaveMobile?.isNativeApp) {
  // Native app specific code
}
```
