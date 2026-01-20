# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mindweave** is an AI-powered personal knowledge hub that helps users capture, organize, and rediscover their ideas, notes, bookmarks, and learnings. Built with Next.js 15, PostgreSQL with pgvector, and Claude AI.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.5
- **Database**: PostgreSQL 16 + pgvector extension
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth)
- **AI**: Claude API (Anthropic)
- **Embeddings**: OpenAI (text-embedding-3-small) or Cohere
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
│       │   ├── (dashboard)/    # Protected dashboard pages
│       │   │   ├── capture/    # Content creation
│       │   │   ├── search/     # Search interface
│       │   │   └── library/    # Content library
│       │   ├── api/            # API routes
│       │   └── layout.tsx      # Root layout
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   └── layout/         # Layout components (header, nav)
│       ├── lib/
│       │   ├── db/             # Database schema and client
│       │   ├── ai/             # Claude API and embeddings
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

This project uses the **Ralph Wiggum plugin** for iterative, test-driven development:
1. Build ONE feature at a time
2. Test thoroughly before moving to next feature
3. Fix issues immediately, no deferred bugs
4. Commit after each feature completes

### Using Ralph

- Start loop: `/ralph-loop`
- Cancel loop: `/cancel-ralph`
- Help: `/ralph`

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
ANTHROPIC_API_KEY=<get from console.anthropic.com>
OPENAI_API_KEY=<get from platform.openai.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Feature Status

See [STATUS.md](STATUS.md) for current feature development status and progress.

## Key Features (Planned)

### Phase 1: Core Functionality
- [x] Authentication (Google OAuth)
- [ ] Content capture (notes, links, files)
- [ ] Content library with filtering
- [ ] Full-text search

### Phase 2: AI Features
- [ ] Claude auto-tagging
- [ ] Vector embeddings
- [ ] Semantic search
- [ ] Knowledge Q&A

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
- `embedding`: Vector (1536 dimensions for OpenAI)
- `model`: Embedding model used

## AI Integration

### Claude API
Used for:
- Auto-tagging content
- Answering questions about knowledge base
- Content summarization

Files: `lib/ai/claude.ts`

### Embeddings
Used for:
- Semantic search
- Content recommendations

Files: `lib/ai/embeddings.ts`

**Note**: Embedding generation is a placeholder. Choose and configure:
- OpenAI (recommended)
- Cohere
- HuggingFace (self-hosted)

## Code Style

- Use TypeScript strict mode
- Prefer server components over client components
- Use server actions for mutations
- Follow Next.js App Router conventions
- Use Tailwind utility classes
- Validate inputs with Zod schemas

## Testing Strategy (Future)

- Unit tests: Vitest
- Integration tests: Playwright
- Run tests before commits with Ralph workflow

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
- **AWS**: ECS with RDS PostgreSQL

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
- [Claude API](https://docs.anthropic.com/)
- [pgvector](https://github.com/pgvector/pgvector)
- [Tailwind CSS](https://tailwindcss.com/)
