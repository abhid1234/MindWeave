# Mindweave

**AI-Powered Personal Knowledge Hub**

Mindweave helps you capture, organize, and rediscover your ideas, notes, bookmarks, and learnings using the power of AI.

## Features

- **Quick Capture**: Save notes, links, and files instantly
- **AI Auto-Tagging**: Automatically organize your content
- **Semantic Search**: Find content by meaning, not just keywords
- **Knowledge Q&A**: Ask questions and get answers from your knowledge base
- **Smart Library**: Browse and filter all your content in one place
- **Privacy First**: Your data stays yours - self-host or use our secure cloud

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript 5.5
- **Backend**: Next.js Server Actions, Drizzle ORM
- **Database**: PostgreSQL 16 + pgvector
- **Auth**: Auth.js v5 with Google OAuth
- **AI**: Claude API (Anthropic) + Google Gemini (embeddings)
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
├── apps/web/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Core libraries (DB, AI, auth)
│   └── types/            # TypeScript types
├── docker/               # Docker Compose configuration
├── scripts/              # Development scripts
└── STATUS.md             # Feature development tracker
```

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

#### 7. Move to Next Feature
Only start the next feature after:
- ✅ Current feature fully implemented
- ✅ Thoroughly tested in feature branch
- ✅ Merged to main
- ✅ **ALL tests passing in main branch**
- ✅ No regressions detected
- ✅ Build succeeds in main

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

1. **Anthropic API** (Required for AI features)
   - Sign up: https://console.anthropic.com/
   - Create API key
   - Add to `.env.local` as `ANTHROPIC_API_KEY`
   - Used for: Auto-tagging, Q&A, content summarization
   - Cost: Pay-as-you-go pricing

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

### Phase 1: Core Features (In Progress)
- [x] Project scaffolding
- [x] Docker PostgreSQL setup
- [x] Authentication (Google OAuth + JWT sessions)
- [ ] Content capture (notes, links, files)
- [ ] Content library with filtering
- [ ] Full-text search
- [ ] Manual tagging

### Phase 2: AI Features (Planned)
- [ ] AI auto-tagging
- [ ] Vector embeddings
- [ ] Semantic search
- [ ] Knowledge Q&A chat interface

### Phase 3: Advanced Features (Future)
- [ ] Browser extension for quick capture
- [ ] Mobile app (React Native)
- [ ] Collaborative knowledge bases
- [ ] Advanced analytics and insights
- [ ] Import from Notion, Evernote, etc.

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_URL` | App URL (http://localhost:3000) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI features | Yes |
| `GOOGLE_AI_API_KEY` | Google Gemini API key for embeddings | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | No |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | No |

## Deployment

### Google Cloud Platform (Production-Ready)

Mindweave is optimized for deployment on Google Cloud Platform using Cloud Run, Cloud Build, and Cloud SQL.

#### Quick Deploy

```bash
# 1. Setup secrets
npm run gcp:setup-secrets

# 2. Deploy to Cloud Run
npm run gcp:deploy
```

**See [DEPLOYMENT.md](DEPLOYMENT.md) for complete GCP deployment guide including:**
- Cloud SQL setup with pgvector
- Secret Manager configuration
- CI/CD with Cloud Build triggers
- Custom domains and SSL
- Monitoring and logging
- Cost optimization

#### Alternative: Docker Self-Hosting

1. **Build Docker image**
   ```bash
   docker build -t mindweave .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### Alternative: Other Platforms

- **Vercel**: Deploy directly, use Neon or Supabase for database
- **Railway**: Simple one-click deployment
- **AWS**: Use ECS with RDS PostgreSQL
- **DigitalOcean**: App Platform with managed PostgreSQL

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
