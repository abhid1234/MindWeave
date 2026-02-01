# CLAUDE.md

This file provides guidance for AI assistants when working with code in this repository.

## Project Overview

**Mindweave** is an AI-powered personal knowledge hub that helps users capture, organize, and rediscover their ideas, notes, bookmarks, and learnings. Built with Next.js 15, PostgreSQL with pgvector, and Google Gemini AI.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.5
- **Database**: PostgreSQL 16 + pgvector extension
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth)
- **AI**: Google Gemini (tagging, Q&A, embeddings)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Package Manager**: pnpm 9.5
- **Build System**: Turborepo 2.0
- **Dev Environment**: Docker Compose

## Project Structure

```
Mindweave/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/
│       │   ├── (auth)/         # Auth pages (login, register)
│       │   ├── dashboard/      # Protected dashboard pages
│       │   │   ├── capture/    # Content creation
│       │   │   ├── search/     # Search interface (keyword + semantic)
│       │   │   ├── ask/        # Knowledge Q&A chat
│       │   │   └── library/    # Content library
│       │   ├── actions/        # Server actions
│       │   ├── api/            # API routes
│       │   └── layout.tsx      # Root layout
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── layout/         # Layout components (header, nav)
│       │   ├── library/        # Library components (ContentCard, FilterBar, etc.)
│       │   └── search/         # Search components (SemanticSearchForm, KnowledgeQA)
│       ├── lib/
│       │   ├── db/             # Database schema and client
│       │   ├── ai/             # Gemini API and embeddings
│       │   ├── auth.ts         # Auth.js configuration
│       │   ├── utils.ts        # Utility functions
│       │   └── validations.ts  # Zod validation schemas
│       ├── types/              # TypeScript type definitions
│       └── public/             # Static assets
├── docker/                     # Docker Compose setup
├── scripts/                    # Development and setup scripts
└── STATUS.md                   # Project status tracker
```

## Development Workflow

This project uses a **strict test-driven development workflow** with feature branches and comprehensive testing:

### Feature Development Cycle

**For each feature, follow these steps in order:**

#### 1. Create Feature Branch
```bash
git checkout -b feature/feature-name
```

Branch naming convention:
- `feature/authentication-flow`
- `feature/note-capture`
- `feature/semantic-search`

#### 2. Build the Feature
- Implement the feature following the plan in STATUS.md
- Focus on ONE feature at a time
- Follow existing code patterns and conventions
- Use Ralph Wiggum plugin for iterative development: `/ralph-loop`

#### 3. Write Comprehensive Test Cases
**Testing Requirements:**
- Unit tests for all business logic functions
- Integration tests for API routes and database operations
- Component tests for React components with React Testing Library
- E2E tests for critical user flows with Playwright
- **Minimum code coverage: 80%**

```bash
npm run test:watch       # Develop tests in watch mode
npm run test:coverage    # Check coverage percentage
```

#### 4. Verify All Quality Checks Pass
Before merging, ensure:
```bash
npm run test             # ✅ All tests pass
npm run test:coverage    # ✅ Coverage ≥ 80%
npm run type-check       # ✅ No TypeScript errors
npm run lint             # ✅ No linting errors
npm run build            # ✅ Build succeeds
```

**Manual verification:**
- ✅ Feature works as expected in browser
- ✅ Edge cases handled
- ✅ Error states tested
- ✅ No console errors or warnings

#### 5. Merge to Main
Only merge when feature is **completely solid**:
```bash
# Run all checks one final time in feature branch
npm run test && npm run type-check && npm run lint

# Merge to main
git checkout main
git merge feature/feature-name

# Push to remote
git push origin main

# Delete feature branch
git branch -d feature/feature-name
```

#### 6. Run Full Test Suite in Main Branch
**CRITICAL: Verify main branch stability after every merge**
```bash
# Switch to main branch
git checkout main

# Run complete test suite
npm run test              # All unit & integration tests
npm run test:e2e          # All E2E tests
npm run test:coverage     # Verify coverage ≥ 80%
npm run type-check        # TypeScript validation
npm run lint              # Code quality
npm run build             # Production build

# Manual verification
# - Test the feature in the browser
# - Check for console errors
# - Verify existing features still work
```

**If any tests fail after merge:**
- ⚠️ **STOP - Do not proceed to next feature**
- Fix the issue immediately in main branch
- Re-run all tests until they pass
- Investigate why tests passed in feature branch but failed in main
- Main branch must **ALWAYS** be stable and deployable

**Why this step is critical:**
- Catches integration issues between features
- Detects regressions in existing functionality
- Ensures main branch is always production-ready
- Prevents cascading failures in future features

#### 7. Update Documentation
**📝 MANDATORY: Update documentation after every feature completion**

```bash
# Update STATUS.md
# - Mark feature as complete in "Completed Features" section
# - Add entry in "Recent Updates" with timestamp and details
# - Update "Current Focus" to next feature
# - Mark feature checkbox in "Pending Features" as [x]

# Update README.md
# - Mark feature as complete [x] in "Feature Roadmap" section

# Commit documentation updates
git add README.md STATUS.md
git commit -m "docs: Update documentation after [feature-name] completion"
git push origin main
```

**Why this is critical:**
- Keeps project status transparent and up-to-date
- Helps team understand what's completed
- Prevents confusion (like we just had!)
- Makes it easy to see project progress

#### 8. Move to Next Feature
**Do not start the next feature until the current one is:**
- ✅ Fully implemented
- ✅ All tests passing with ≥80% coverage in feature branch
- ✅ Merged to main
- ✅ **ALL tests passing in main branch (no regressions)**
- ✅ Build succeeds in main
- ✅ Feature verified working in main branch
- ✅ **Documentation updated (README.md and STATUS.md)**

### Using Ralph Wiggum Plugin

Ralph helps with iterative development within a feature branch:

- Start loop: `/ralph-loop`
- Cancel loop: `/cancel-ralph`
- Help: `/ralph`

**Ralph's role:**
- Helps build the feature iteratively
- Runs tests after each change
- Fixes issues immediately
- Ensures code quality

**Important:** Ralph operates within the feature branch workflow above.

## Common Commands

```bash
# Setup (first time only)
./scripts/setup-dev.sh

# Development
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm lint               # Run linter
pnpm type-check         # TypeScript type checking
pnpm format             # Format code with Prettier

# Database
pnpm docker:up          # Start PostgreSQL
pnpm docker:down        # Stop PostgreSQL
pnpm docker:logs        # View PostgreSQL logs
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Apply migrations
pnpm db:push            # Push schema changes
pnpm db:studio          # Open Drizzle Studio

# Seeding
cd apps/web && tsx ../../scripts/seed-db.ts
```

## Environment Variables

Required in `apps/web/.env.local`:

```env
# Database
DATABASE_URL=postgresql://mindweave:dev_password_change_in_prod@localhost:5432/mindweave_dev

# Auth
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=<optional>
AUTH_GOOGLE_SECRET=<optional>

# AI
GOOGLE_AI_API_KEY=<get from aistudio.google.com/app/apikey>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Documentation

- **[STATUS.md](STATUS.md)** - Current feature development status and progress
- **[API.md](API.md)** - Complete API reference (endpoints, server actions, rate limits)
- **[TESTING.md](TESTING.md)** - Comprehensive testing strategy and best practices
- **[WORKFLOW_CHECKLIST.md](WORKFLOW_CHECKLIST.md)** - Step-by-step checklist for each feature
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - GCP deployment guide with security configuration

## Key Features

### Phase 1: Core Functionality ✅ Complete
- [x] Authentication (Google OAuth + JWT sessions)
- [x] Content capture (notes, links, files)
- [x] Content library with filtering and sorting
- [x] Full-text search
- [x] Manual tagging

### Phase 2: AI Features ✅ Complete
- [x] AI auto-tagging (Gemini)
- [x] Vector embeddings (Google Gemini)
- [x] Semantic search (pgvector)
- [x] Knowledge Q&A (RAG with Gemini)

## Database Schema

### Users
- Standard Auth.js schema
- OAuth support via Google

### Content
- `type`: note | link | file
- `title`: Content title
- `body`: Main content (optional)
- `url`: For links (optional)
- `tags`: User-defined tags
- `autoTags`: AI-generated tags
- `metadata`: JSON for additional data

### Embeddings
- `contentId`: Reference to content
- `embedding`: Vector (768 dimensions for Gemini)
- `model`: Embedding model used

## AI Integration

### Google Gemini API
Used for:
- Auto-tagging content
- Answering questions about knowledge base
- Content summarization
- Semantic search embeddings
- Content recommendations

Files: `lib/ai/embeddings.ts`

**Note**: Embeddings are now configured to use Google Gemini (text-embedding-004) with 768 dimensions.

## Code Style

- Use TypeScript strict mode
- Prefer server components over client components
- Use server actions for mutations
- Follow Next.js App Router conventions
- Use Tailwind utility classes
- Validate inputs with Zod schemas

## Testing Strategy

**Current Status**: 352 tests passing with comprehensive coverage

- **Unit tests**: Vitest - testing business logic, utilities, server actions
- **Component tests**: React Testing Library - testing UI components
- **E2E tests**: Playwright - testing critical user flows
- **Coverage**: Target ≥80% for all features

```bash
npm run test              # Run all unit/component tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run Playwright E2E tests
```

## Deployment

### Google Cloud Platform (Recommended)

Mindweave is production-ready for GCP deployment:

**Quick Deploy:**
```bash
pnpm gcp:setup-secrets  # Setup secrets in Secret Manager
pnpm gcp:deploy         # Deploy to Cloud Run
```

**Architecture:**
- **Application**: Cloud Run (serverless containers)
- **Database**: Cloud SQL for PostgreSQL + pgvector
- **Registry**: Google Container Registry (GCR)
- **CI/CD**: Google Cloud Build
- **Secrets**: Secret Manager

**Files:**
- `Dockerfile` - Production container build
- `cloudbuild.yaml` - CI/CD pipeline configuration
- `cloud-run-service.yaml` - Service configuration template
- `scripts/deploy-gcp.sh` - Automated deployment script
- `scripts/setup-gcp-secrets.sh` - Secrets configuration
- `DEPLOYMENT.md` - Complete deployment guide

**Key Commands:**
```bash
pnpm gcp:setup-secrets  # Configure secrets
pnpm gcp:deploy         # Full deployment
pnpm gcp:build          # Build only (no deploy)
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide including:
- Cloud SQL setup with pgvector
- Secret Manager configuration
- CI/CD with Cloud Build triggers
- Custom domains and SSL
- Monitoring and cost optimization

### Alternative Platforms

- **Docker**: Use provided Dockerfile for self-hosting
- **Vercel**: Deploy directly with Neon/Supabase database
- **Railway**: One-click deployment

## Contributing

When making changes:
1. Follow existing code patterns
2. Update STATUS.md with progress
3. Test changes locally
4. Use Ralph for feature development
5. Commit with descriptive messages

## Troubleshooting

### Docker issues
- Ensure Docker is running
- Check logs: `pnpm docker:logs`
- Restart: `pnpm docker:down && pnpm docker:up`

### Database connection errors
- Verify DATABASE_URL in .env.local
- Check PostgreSQL is running: `docker ps`
- Test connection: `psql $DATABASE_URL`

### TypeScript errors
- Run `pnpm type-check` to see all errors
- Check imports and path aliases
- Ensure dependencies are installed

### Authentication issues
- Verify AUTH_SECRET is set
- Check OAuth credentials (if using Google)
- Clear cookies and try again

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Auth.js](https://authjs.dev/)
- [Google Gemini API](https://ai.google.dev/docs)
- [pgvector](https://github.com/pgvector/pgvector)
- [Tailwind CSS](https://tailwindcss.com/)
