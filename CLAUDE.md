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

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Read Before Writing**: Always read existing code before modifying. Understand patterns first.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 4. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 5. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Development Workflow

### Quality Gates
Before any commit, run these checks:
```bash
pnpm test -- --run       # All tests pass (1440+ tests)
pnpm lint                # No linting errors
pnpm type-check          # No TypeScript errors
```

Before deployment:
```bash
pnpm build               # Production build succeeds
```

### What Needs Deployment
- **Code changes** (components, actions, pages, config, schema) → commit, push, **and deploy**
- **STATUS.md / docs-only changes** → commit and push only. **Never deploy** — these are not used at runtime

### Feature Development
1. **Plan first** - Enter plan mode, identify files to change, write approach
2. **Build the feature** - Focus on ONE feature at a time, follow existing patterns
3. **Write tests** - Unit, component, integration tests. Target 80%+ coverage
4. **Verify quality** - Run all quality gates above
5. **Test in browser** - `pnpm dev` and manually verify the feature works
6. **Commit and push** - Descriptive commit messages
7. **Update STATUS.md** - Mark feature complete, add to recent updates (commit + push only, no deploy)
8. **Deploy** - Build and deploy to Cloud Run when ready (only for code changes)

### Bug Fixing
1. **Reproduce** - Understand the bug (screenshot, error message, steps)
2. **Investigate** - Read code, add debug logs if needed, trace the root cause
3. **Fix** - Minimal, targeted fix at the root cause (not symptoms)
4. **Remove debug code** - Clean up any console.logs added during investigation
5. **Test** - Run full test suite, fix any broken tests
6. **Verify in browser** - Confirm the fix works visually
7. **Commit, push, update STATUS.md**

### Using Ralph Wiggum Plugin

Ralph helps with iterative development:

- Start loop: `/ralph-loop`
- Cancel loop: `/cancel-ralph`
- Help: `/ralph`

**Ralph's role:**
- Helps build the feature iteratively
- Runs tests after each change
- Fixes issues immediately
- Ensures code quality

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

# Cloudflare Turnstile (bot protection on login/register)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<from dash.cloudflare.com → Turnstile>
TURNSTILE_SECRET_KEY=<from dash.cloudflare.com → Turnstile>

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
