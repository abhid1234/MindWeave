# Mindweave

**AI-Powered Personal Knowledge Hub**

Mindweave helps you capture, organize, and rediscover your ideas, notes, bookmarks, and learnings using the power of AI.

## Features

- **Quick Capture**: Save notes, links, and files instantly
- **Browser Extension**: One-click save from any webpage (Chrome)
- **AI Auto-Tagging**: Automatically organize your content
- **AI Summarization**: Auto-generate concise summaries for your content
- **Content Clustering**: AI groups similar content together with meaningful names
- **Key Insights**: AI identifies patterns, connections, and knowledge gaps
- **Smart Search Suggestions**: Get intelligent search suggestions based on your content
- **Semantic Search**: Find content by meaning, not just keywords
- **Knowledge Q&A**: Ask questions and get answers from your knowledge base
- **Content Recommendations**: "View Similar" and "Recommended for You" based on semantic similarity
- **Advanced Analytics**: Visualize your knowledge base with charts and AI-generated insights
- **Smart Library**: Browse and filter all your content with infinite scroll
- **Dark Mode**: Light, dark, and system theme options
- **PWA Support**: Install as a native app on desktop and mobile
- **Mobile Apps**: Native iOS and Android apps via Capacitor
- **SEO Optimized**: Open Graph and Twitter Card metadata for shared content
- **Onboarding Flow**: Guided 3-step onboarding for new users with sample content seeding
- **Public Profiles**: Shareable user profiles with public collections
- **Bot Protection**: Cloudflare Turnstile CAPTCHA on login and registration
- **Security Hardened**: Authenticated file serving, rate limiting, IDOR prevention, SSRF protection, abuse prevention
- **Privacy First**: Your data stays yours - self-host or use our secure cloud

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript 5.5
- **Backend**: Next.js Server Actions, Drizzle ORM
- **Database**: PostgreSQL 16 + pgvector
- **Auth**: Auth.js v5 with Google OAuth + Email/Password + Password Reset (Resend)
- **AI**: Google Gemini (tagging, Q&A, embeddings)
- **Styling**: Tailwind CSS + shadcn/ui
- **Tooling**: npm, Turborepo, Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org/))
- Docker Desktop ([download](https://www.docker.com/products/docker-desktop))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abhid1234/MindWeave.git
   cd MindWeave
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup-dev.sh
   ```

   This will:
   - Install dependencies
   - Start PostgreSQL with Docker
   - Run database migrations
   - Create `.env.local` from template

3. **Configure environment variables**

   Edit `apps/web/.env.local` and add your API keys:

   ```bash
   # Generate auth secret
   openssl rand -base64 32

   # Get API keys from required providers
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
Mindweave/
├── apps/
│   ├── web/              # Next.js application
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Core libraries (DB, AI, auth)
│   │   └── types/        # TypeScript types
│   └── mobile/           # Capacitor mobile app
│       ├── android/      # Android native project
│       ├── ios/          # iOS native project
│       └── src/          # Capacitor bridge code
├── browser-extension/     # Chrome browser extension
├── docker/               # Docker Compose configuration
├── scripts/              # Development scripts
└── STATUS.md             # Feature development tracker
```

## Browser Extension

Save any webpage to Mindweave with one click using our Chrome extension.

### Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `browser-extension/` folder
5. Pin the extension from the puzzle piece menu

### Usage

1. Navigate to any webpage
2. Click the Mindweave extension icon
3. Login if prompted (redirects to Mindweave)
4. Edit title/add tags if desired
5. Click **Save to Mindweave**

See [browser-extension/README.md](browser-extension/README.md) for detailed documentation.

## Mobile App

Mindweave is available as a native mobile app for iOS and Android using Capacitor.

### Features

- Native app store distribution
- Push notifications
- Deep linking (`mindweave://` and universal links)
- Share intent (receive shared content from other apps)
- Native status bar and safe area handling

### Development

```bash
# Install dependencies
cd apps/mobile
npm install

# Build the project
npm run build

# Add platforms (first time only)
npm run add:ios
npm run add:android

# Open in IDE
npm run ios      # Opens Xcode
npm run android  # Opens Android Studio
```

### Building for Release

**Android:**
1. Generate a keystore for signing
2. Build signed AAB in Android Studio
3. Upload to Google Play Console

**iOS:**
1. Configure code signing in Xcode
2. Archive and upload to App Store Connect

See [apps/mobile/README.md](apps/mobile/README.md) for detailed documentation.

## Development

### Development Workflow

This project follows a **strict test-driven development workflow** with feature branches:

#### 1. Create Feature Branch
```bash
git checkout -b feature/authentication-flow
git checkout -b feature/note-capture
git checkout -b feature/semantic-search
```

#### 2. Build the Feature
- Implement the feature following the plan
- Focus on one feature at a time
- Follow existing code patterns and conventions

#### 3. Write Test Cases
```bash
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Generate coverage report
```

**Testing Requirements:**
- **Unit tests** for all business logic functions
- **Integration tests** for API routes and database operations
- **Component tests** for React components
- **E2E tests** for critical user flows
- **Minimum code coverage**: 80%

#### 4. Run Tests & Verify Coverage
```bash
npm run test                    # Run all tests
npm run test:coverage           # Check coverage
npm run type-check              # TypeScript validation
npm run lint                    # Code quality check
```

**Feature is ready to merge only when:**
- ✅ All tests pass
- ✅ Code coverage ≥ 80%
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Feature is manually tested and working

#### 5. Merge to Main
```bash
# Ensure all checks pass in feature branch first
npm run test && npm run type-check && npm run lint

# Merge to main
git checkout main
git merge feature/feature-name

# Push to remote
git push origin main

# Delete feature branch
git branch -d feature/feature-name
```

#### 6. Run Full Test Suite in Main
**CRITICAL: After every merge, verify main branch stability**
```bash
# In main branch, run complete test suite
npm run test              # All unit & integration tests
npm run test:e2e          # All E2E tests
npm run type-check        # TypeScript validation
npm run lint              # Code quality
npm run build             # Production build

# Verify coverage hasn't dropped
npm run test:coverage
```

**If any tests fail after merge:**
- ⚠️ DO NOT proceed to next feature
- Fix the issue immediately in main
- Re-run all tests until they pass
- Main branch must ALWAYS be stable

#### 7. Update Documentation
**📝 MANDATORY after every feature:**
```bash
# Update STATUS.md
# - Mark feature complete in "Completed Features"
# - Add entry to "Recent Updates" with timestamp
# - Update "Current Focus" to next feature
# - Mark checkbox [x] in "Pending Features"

# Update README.md
# - Mark feature complete [x] in "Feature Roadmap"

# Commit and push
git add README.md STATUS.md
git commit -m "docs: Update documentation after [feature-name] completion"
git push origin main
```

#### 8. Move to Next Feature
Only start the next feature after:
- ✅ Current feature fully implemented
- ✅ Thoroughly tested in feature branch
- ✅ Merged to main
- ✅ **ALL tests passing in main branch**
- ✅ No regressions detected
- ✅ Build succeeds in main
- ✅ **Documentation updated (README.md and STATUS.md)**

### Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler
npm run format           # Format code with Prettier

# Testing (to be configured)
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests

# Database
npm run docker:up        # Start PostgreSQL
npm run docker:down      # Stop PostgreSQL
npm run docker:logs      # View database logs
npm run db:generate      # Generate migration files
npm run db:migrate       # Apply migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio (GUI)

# Mobile App
npm run mobile:build     # Build mobile app
npm run mobile:sync      # Sync web assets to native projects
npm run mobile:ios       # Open iOS project in Xcode
npm run mobile:android   # Open Android project in Android Studio

# Development Tools
./scripts/setup-dev.sh              # Initial setup
tsx scripts/seed-db.ts              # Seed sample data
```

### Database Management

**View database in GUI:**
```bash
npm run db:studio
# Opens at http://localhost:4983
```

**Connect with psql:**
```bash
psql postgresql://mindweave:dev_password_change_in_prod@localhost:5432/mindweave_dev
```

**Seed sample data:**
```bash
cd apps/web
tsx ../../scripts/seed-db.ts
```

## API Keys Setup

### Required APIs

1. **Google Gemini API** (Required for AI features)
   - Sign up: https://aistudio.google.com/app/apikey
   - Create API key
   - Add to `.env.local` as `GOOGLE_AI_API_KEY`
   - Used for: Auto-tagging, Q&A, content summarization, embeddings
   - Cost: Free tier available, pay-as-you-go pricing

2. **Google AI API** (Required for embeddings)
   - Sign up: https://aistudio.google.com/app/apikey
   - Create API key
   - Add to `.env.local` as `GOOGLE_AI_API_KEY`
   - Used for: Vector embeddings (text-embedding-004)
   - Cost: Free tier available

3. **Google OAuth** (Optional - for authentication)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
   - Add credentials to `.env.local`

## Feature Roadmap

See [STATUS.md](STATUS.md) for current development status.

### Phase 1: Core Features ✅ Complete
- [x] Project scaffolding
- [x] Docker PostgreSQL setup
- [x] Authentication (Google OAuth + Email/Password + Password Reset)
- [x] Content capture (notes, links, files)
- [x] Content library with filtering and sorting
- [x] Full-text search
- [x] Manual tagging

### Phase 2: AI Features ✅ Complete
- [x] AI auto-tagging (Gemini API)
- [x] Vector embeddings (Google Gemini)
- [x] Semantic search (pgvector similarity)
- [x] Knowledge Q&A chat interface (RAG with Gemini)
- [x] Content editing and deletion

### Phase 3: Advanced Content Management ✅ Complete
- [x] File uploads (drag-and-drop, multi-file support)
- [x] Content sharing (public share links)
- [x] Bulk operations (multi-select, bulk delete/add to collection)
- [x] Export functionality (JSON, Markdown, CSV formats)
- [x] Collections/folders (organize content into collections)
- [x] Favorites/pinning (mark content as favorites)

### Phase 3: Polish & Optimization ✅ Complete
- [x] Comprehensive component tests (647 tests total)
- [x] Error boundaries (global, dashboard, reusable)
- [x] Accessibility improvements (skip nav, ARIA, keyboard support)

### Phase 4: UI Enhancements ✅ Complete
- [x] Dark mode (Light/Dark/System theme switching)
- [x] Browser extension for quick capture (Chrome)
- [x] Loading skeletons for dashboard pages
- [x] Toast notifications for form feedback
- [x] Stagger animations for content grid and search results
- [x] Enhanced hover states and micro-interactions

### Phase 5: Import & PWA ✅ Complete
- [x] Import tools (Browser bookmarks, Pocket, Notion, Evernote, X/Twitter)
- [x] PWA enhancements (mobile navigation, service worker, offline support)
- [x] Installable app experience on desktop and mobile
- [x] App icons for all platforms (72-512px)
- [x] Mobile E2E tests (Pixel 5, iPhone 12)

### Phase 6: Mobile App ✅ Complete
- [x] Capacitor project setup for iOS and Android
- [x] Native push notification support
- [x] Deep linking (mindweave:// and universal links)
- [x] Share intent for receiving content from other apps
- [x] Safe area and status bar handling
- [x] Device registration API for push tokens

### Phase 7: Enhancements ✅ Complete
- [x] Content recommendations ("View Similar" and dashboard widget)
- [x] Advanced analytics and insights
- [x] AI-powered features (auto-summarization, clustering, insights, search suggestions)
- [x] Performance optimizations (database indexes, N+1 fixes, infinite scroll, caching)

### Phase 8: Security Hardening ✅ Complete
- [x] Rate limiting for all API endpoints and server actions
- [x] File upload security (magic bytes verification)
- [x] Authentication hardening (multi-environment guards, password complexity)
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Secure random share IDs (crypto.randomBytes)
- [x] Cloudflare Turnstile bot protection on login/register forms
- [x] Authorization fixes (IDOR prevention, defense-in-depth on mutations)
- [x] Authenticated file serving (files behind /api/files auth gate)
- [x] Data exposure prevention (export metadata sanitization)
- [x] Input validation hardening (constrained metadata schema, import limits)

### Phase 9: Polish & Performance ✅ Complete
- [x] Lighthouse audit with perfect accessibility score (100)
- [x] AI features UI integration (SearchSuggestions, ContentClusters)
- [x] Mobile CI/CD pipeline (GitHub Actions for Android/iOS builds)
- [x] API documentation (comprehensive API.md)

### Phase 10: Onboarding & Public Profiles ✅ Complete
- [x] 3-step onboarding flow (Welcome, Create Content, Explore Features)
- [x] Sample content seeding (~15 notes/links across 4 themes on onboarding completion/skip)
- [x] Public user profiles with username, bio, and visibility toggle
- [x] Public profile pages with SEO metadata (OpenGraph, Twitter Cards)
- [x] Public collection pages showing shared content
- [x] Profile settings page in dashboard
- [x] Collection public/private toggle

### Phase 11: Auth Enhancements ✅ Complete
- [x] Email/password registration and login
- [x] Password reset flow via Resend email (forgot-password, tokenized reset links)
- [x] OAuth account linking (Google can link to existing email accounts)

### Phase 12: Mobile App Fixes & UX Improvements ✅ Complete
- [x] Server-side WebView detection for Google OAuth (prevents `403 disallowed_useragent`)
- [x] HTML intermediary page for mobile OAuth flow (replaces 302 redirects)
- [x] Hidden Google OAuth in Android WebView (temporary; email/password login works)
- [x] Clickable recent items on dashboard (navigates to library with highlight)
- [x] Fixed bottom nav overlapping content on mobile
- [x] Fixed service worker caching stale auth pages (NetworkFirst for login/register)

### Phase 13: UI Polish ✅ Complete
- [x] Login page "Back to home" navigation link
- [x] Fixed sidebar navigation shake (view transition opacity-only crossfade)
- [x] Clickable "Total Items" dashboard stat (links to library)

### Phase 14: Abuse Prevention ✅ Complete
- [x] Fixed X-Forwarded-For IP spoofing (rate limiter uses last IP from trusted proxy)
- [x] Rate limiting on 30+ server actions (content, tasks, collections, profile, analytics)
- [x] Per-email rate limiting on auth forms (login, register, forgot-password)
- [x] Account enumeration fix (registration no longer reveals existing emails)
- [x] Password reset hardening (30-min expiry, single-use tokens)
- [x] SSRF prevention (blocks private IPs, cloud metadata, non-http protocols)
- [x] Export metadata allowlist (only safe fields exported)
- [x] Content-Disposition header injection prevention (RFC 5987 encoding)
- [x] File serving rate limiting (200 req/min)

### Future Enhancements (Planned)
- [ ] Google OAuth in Android WebView (Custom Tabs or Chrome redirect flow)
- [ ] Firefox browser extension
- [ ] Collaborative knowledge bases
- [ ] Content versioning and history

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_URL` | App URL (http://localhost:3000) | Yes |
| `GOOGLE_AI_API_KEY` | Gemini API key for AI features | Yes |
| `GOOGLE_AI_API_KEY` | Google Gemini API key for embeddings | Yes |
| `RESEND_API_KEY` | Resend API key for password reset emails | No |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | No |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (from dash.cloudflare.com) | No |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | No |
| `METRICS_AUTH_TOKEN` | Bearer token for `/api/metrics` in production | No |

## Deployment

### Production (Live)

Mindweave is deployed on Google Cloud Platform:

- **URL**: https://mindweave.space
- **Project**: `mindweave-prod` | **Region**: `us-central1`

| Service | Details |
|---------|---------|
| **Cloud Run** | Next.js app (512Mi, 1 CPU, 0–10 instances) |
| **Cloud SQL** | PostgreSQL 16 + pgvector (db-f1-micro) |
| **Secret Manager** | 7 secrets (DB, auth, API keys, OAuth, Turnstile) |
| **Cloud Build** | Docker image builds via `cloudbuild.yaml` |

### CI/CD

Every push to `main` automatically triggers a Cloud Build that builds the Docker image and deploys to Cloud Run.

### Deploy Manually

```bash
# From the project root:
cd Mindweave
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_SERVICE_NAME=mindweave,_REGION=us-central1,_DATABASE_URL=postgresql://user:pass@localhost:5432/mindweave,_APP_URL=https://mindweave.space,SHORT_SHA=manual-$(date +%s)" \
  --project=mindweave-prod
```

### Run Database Migrations

```bash
# Authorize your IP temporarily
MY_IP=$(curl -4 -s ifconfig.me)
gcloud sql instances patch mindweave-db --authorized-networks="${MY_IP}/32" --project=mindweave-prod

# Push schema
DATABASE_URL="postgresql://mindweave:PASSWORD@34.27.185.36:5432/mindweave_prod" npx drizzle-kit push --force

# Remove authorized network when done
gcloud sql instances patch mindweave-db --clear-authorized-networks --project=mindweave-prod
```

### GCP Setup from Scratch

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full guide covering:
- Cloud SQL setup with pgvector
- Secret Manager configuration
- CI/CD with Cloud Build triggers
- Custom domains and SSL
- Monitoring and cost optimization

### Alternative Platforms

- **Docker**: `docker build -t mindweave . && docker run -p 3000:3000 mindweave`
- **Vercel**: Deploy directly, use Neon or Supabase for database
- **Railway**: One-click deployment

## Troubleshooting

### Docker won't start
- Ensure Docker Desktop is running
- Check for port conflicts (5432)
- Try: `npm run docker:down && npm run docker:up`

### Database connection errors
- Verify Docker container is running: `docker ps`
- Check connection string in `.env.local`
- Test connection: `psql $DATABASE_URL`

### TypeScript errors
- Run `npm run type-check` to see all errors
- Ensure all dependencies are installed
- Clear `.next` folder and rebuild

### Authentication not working
- Verify `AUTH_SECRET` is set (run `openssl rand -base64 32`)
- Check OAuth credentials if using Google
- Clear browser cookies and try again

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Documentation**:
  - [CLAUDE.md](CLAUDE.md) - Development guide and workflow
  - [TESTING.md](TESTING.md) - Testing strategy and best practices
  - [WORKFLOW_CHECKLIST.md](WORKFLOW_CHECKLIST.md) - Feature development checklist
  - [DEPLOYMENT.md](DEPLOYMENT.md) - GCP deployment guide
- **Issues**: Report bugs on [GitHub Issues](https://github.com/abhid1234/MindWeave/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/abhid1234/MindWeave/discussions)

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [pgvector](https://github.com/pgvector/pgvector) for vector search
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
