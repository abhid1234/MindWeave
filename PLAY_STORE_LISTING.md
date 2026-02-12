# Google Play Store Listing Guide

## Step 1: Generate Upload Keystore

Run this command once to generate your upload signing key. **Keep this file safe — you need it for every update.**

```bash
cd apps/mobile/android

keytool -genkey -v \
  -keystore mindweave-upload.keystore \
  -alias mindweave \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass <YOUR_STORE_PASSWORD> \
  -keypass <YOUR_KEY_PASSWORD> \
  -dname "CN=Abhijit Das, O=Mindweave, L=Unknown, ST=Unknown, C=US"
```

Then create the `keystore.properties` file (already gitignored):

```bash
cat > apps/mobile/android/keystore.properties << 'EOF'
storeFile=mindweave-upload.keystore
storePassword=<YOUR_STORE_PASSWORD>
keyAlias=mindweave
keyPassword=<YOUR_KEY_PASSWORD>
EOF
```

## Step 2: Build Signed AAB

```bash
cd apps/mobile

# Build the TypeScript bridge code
npm run build

# Sync web assets to Android project
npx cap sync android

# Build the signed Android App Bundle
cd android
./gradlew bundleRelease
```

The signed AAB will be at:
```
apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

## Step 3: Play Console Store Listing

### App Details

| Field | Value |
|-------|-------|
| **App name** | Mindweave |
| **Default language** | English (United States) |
| **App category** | Productivity |
| **Tags** | Notes, Knowledge management, AI, Bookmarks |

### Short Description (80 chars max)

```
AI-powered knowledge hub — capture, organize & rediscover your ideas with AI.
```

### Full Description (4000 chars max)

```
Mindweave is your AI-powered personal knowledge hub. Capture notes, save bookmarks, upload files — then let AI help you organize and rediscover everything.

✨ CAPTURE ANYTHING
• Save notes, links, and files in one place
• Drag-and-drop file uploads (images, PDFs, documents)
• Import from Chrome bookmarks, Pocket, Notion, Evernote, and X/Twitter
• Browser extension for one-click web page saving

🏷️ AI-POWERED ORGANIZATION
• Auto-tagging: AI analyzes your content and suggests relevant tags
• Smart collections: Group related content into color-coded folders
• Content clustering: AI groups similar items together automatically
• Favorites and pinning for quick access

🔍 INTELLIGENT SEARCH
• Keyword search across all your content
• Semantic search: Find content by meaning, not just keywords
• AI-powered search suggestions based on your knowledge base
• Smart filters by type, tag, collection, and date

🧠 ASK YOUR KNOWLEDGE BASE
• Chat with your content using AI-powered Q&A
• Get answers with citations from your saved knowledge
• Discover connections between your notes and bookmarks
• AI extracts key insights and patterns from your collection

📊 ANALYTICS & INSIGHTS
• Dashboard showing your knowledge growth over time
• Tag distribution and collection usage charts
• AI-generated knowledge insights and suggestions
• Content recommendations based on what you've saved

🔒 PRIVACY & SECURITY
• Your data is yours — we never sell personal information
• Secure Google OAuth and email/password authentication
• Cloudflare Turnstile bot protection on login and registration
• Rate limiting and security headers for API protection
• Share specific content via secure, revocable links

📱 WORKS EVERYWHERE
• Web app at mindweave.space
• Progressive Web App (installable on any device)
• Native Android app with share intent support
• Dark mode with system preference detection

Built with Next.js, PostgreSQL, and Google Gemini AI.
```

### Graphics Assets Needed

| Asset | Size | Notes |
|-------|------|-------|
| **App icon** | 512x512 PNG | Already generated at `apps/web/public/icons/icon-512.png` |
| **Feature graphic** | 1024x500 PNG | Banner shown at top of listing — create in Figma/Canva |
| **Phone screenshots** | Min 2, max 8 | 16:9 or 9:16 — capture from Chrome DevTools mobile view |

#### Recommended Screenshots (in order):
1. Dashboard overview showing stats and recommendations
2. Content capture form (note creation)
3. Library with filter bar and content cards
4. Semantic search with results
5. Ask AI chat interface with citations
6. Analytics dashboard with charts
7. Dark mode view

**How to capture screenshots:**
```bash
# Open Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
# Select "Pixel 7" or similar (1080x2400)
# Navigate to each page and screenshot (Ctrl+Shift+P → "Capture screenshot")
```

## Step 4: Content Rating

In Play Console → **Content rating**, answer the questionnaire:

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual content | No |
| Language | No |
| Controlled substances | No |
| User-generated content | **Yes** (users create notes/save links) |
| Sharing user location | No |
| Ads | No |
| In-app purchases | No |

This should result in an **Everyone** rating.

## Step 5: Data Safety Form

In Play Console → **Data safety**, declare what data is collected:

### Data Collected

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| **Email address** | Yes | No | Account management, authentication |
| **Name** | Yes | No | Account management (from Google OAuth) |
| **User-generated content** | Yes | No | App functionality (notes, links, files) |
| **App interactions** | Yes | No | Analytics (content growth, usage stats) |

### Data Handling

| Question | Answer |
|----------|--------|
| Is data encrypted in transit? | **Yes** (HTTPS/TLS) |
| Can users request data deletion? | **Yes** (delete via app or email das.abhijit34@gmail.com) |
| Does the app share data with third parties? | **Yes** — Google Gemini AI for content processing (auto-tagging, search, Q&A) |
| Does the app follow Google's Families policy? | Not a family app (13+ only) |

### Third-Party Data Sharing

| Service | Data Shared | Purpose |
|---------|-------------|---------|
| Google Gemini AI | Content text (notes, links) | Auto-tagging, semantic search embeddings, Q&A answers |
| Google OAuth | Email, name | Authentication |
| Cloudflare Turnstile | None (browser signals only) | Bot protection on login/registration |

## Step 6: App Access (for Review)

Google's review team needs to test the app. Provide:

| Field | Value |
|-------|-------|
| **Login instructions** | "Tap 'Sign in with Google' or register with email/password" |
| **Test account** | Create a test account with sample content pre-loaded |

**Recommended:** Create a demo account (e.g., `mindweave.demo@gmail.com`) with 10-20 sample notes/bookmarks so reviewers can see the app's features.

## Step 7: Pricing & Distribution

| Setting | Value |
|---------|-------|
| **Price** | Free |
| **Countries** | All countries |
| **Contains ads** | No |
| **Content guidelines** | Acknowledged |

## Step 8: Digital Asset Links (Universal Links Verification)

For Android App Links to work, host this file at `https://mindweave.space/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mindweave.app",
    "sha256_cert_fingerprints": ["<YOUR_SIGNING_KEY_FINGERPRINT>"]
  }
}]
```

Get your fingerprint after generating the keystore:
```bash
keytool -list -v -keystore apps/mobile/android/mindweave-upload.keystore -alias mindweave | grep SHA256
```

## Checklist

- [ ] Google Play Developer account ($25) — ✅ Done
- [ ] Generate upload keystore
- [ ] Create keystore.properties
- [ ] Build signed AAB (`./gradlew bundleRelease`)
- [ ] Upload AAB to Play Console
- [ ] Fill in app name, descriptions, category
- [ ] Upload app icon (512x512)
- [ ] Create and upload feature graphic (1024x500)
- [ ] Take and upload phone screenshots (min 2)
- [ ] Complete content rating questionnaire
- [ ] Complete data safety form
- [ ] Set up test account for app review
- [ ] Set pricing (Free) and distribution (All countries)
- [ ] Host assetlinks.json for universal links
- [ ] Submit for review
