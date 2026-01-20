# Mindweave

**AI-Powered Personal Knowledge Hub**

Mindweave helps you capture, organize, and rediscover your ideas, notes, bookmarks, and learnings using the power of AI.

## Features

- **Quick Capture**: Save notes, links, and files instantly
- **AI Auto-Tagging**: Claude automatically organizes your content
- **Semantic Search**: Find content by meaning, not just keywords
- **Knowledge Q&A**: Ask questions and get answers from your knowledge base
- **Smart Library**: Browse and filter all your content in one place
- **Privacy First**: Your data stays yours - self-host or use our secure cloud

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript 5.5
- **Backend**: Next.js Server Actions, Drizzle ORM
- **Database**: PostgreSQL 16 + pgvector
- **Auth**: Auth.js v5 with Google OAuth
- **AI**: Claude API (Anthropic)
- **Embeddings**: OpenAI text-embedding-3-small
- **Styling**: Tailwind CSS + shadcn/ui
- **Tooling**: pnpm, Turborepo, Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org/))
- Docker Desktop ([download](https://www.docker.com/products/docker-desktop))
- pnpm 9.5+ (will be installed by setup script)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mindweave.git
   cd mindweave
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup-dev.sh
   ```

   This will:
   - Install pnpm if needed
   - Install dependencies
   - Start PostgreSQL with Docker
   - Run database migrations
   - Create `.env.local` from template

3. **Configure environment variables**

   Edit `apps/web/.env.local` and add your API keys:

   ```bash
   # Generate auth secret
   openssl rand -base64 32

   # Get API keys from:
   # - https://console.anthropic.com/ (Claude)
   # - https://platform.openai.com/ (OpenAI)
   ```

4. **Start the development server**
   ```bash
   pnpm dev
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

### Available Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
pnpm format           # Format code with Prettier

# Database
pnpm docker:up        # Start PostgreSQL
pnpm docker:down      # Stop PostgreSQL
pnpm docker:logs      # View database logs
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Apply migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio (GUI)

# Development Tools
./scripts/setup-dev.sh              # Initial setup
tsx scripts/seed-db.ts              # Seed sample data
```

### Database Management

**View database in GUI:**
```bash
pnpm db:studio
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

1. **Claude API** (Required for AI features)
   - Sign up: https://console.anthropic.com/
   - Create API key
   - Add to `.env.local` as `ANTHROPIC_API_KEY`
   - Cost: ~$10-20/month for personal use

2. **OpenAI API** (Required for embeddings)
   - Sign up: https://platform.openai.com/
   - Create API key
   - Add to `.env.local` as `OPENAI_API_KEY`
   - Cost: ~$1-5/month for embeddings

3. **Google OAuth** (Optional - for authentication)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
   - Add credentials to `.env.local`

## Feature Roadmap

See [STATUS.md](STATUS.md) for current development status.

### Phase 1: Core Features (In Progress)
- [x] Project scaffolding
- [x] Authentication (Google OAuth)
- [ ] Content capture (notes, links, files)
- [ ] Content library with filtering
- [ ] Full-text search
- [ ] Manual tagging

### Phase 2: AI Features (Planned)
- [ ] Claude auto-tagging
- [ ] Vector embeddings
- [ ] Semantic search
- [ ] Knowledge Q&A chat interface

### Phase 3: Advanced Features (Future)
- [ ] Browser extension for quick capture
- [ ] Mobile app (React Native)
- [ ] Collaborative knowledge bases
- [ ] Advanced analytics and insights
- [ ] Import from Notion, Evernote, etc.

## Development Workflow

This project uses the **Ralph Wiggum plugin** for iterative, test-driven development:

1. **One feature at a time** - Don't start next until current works
2. **Test thoroughly** - Try edge cases, error scenarios
3. **Fix immediately** - Don't defer bugs to later
4. **Commit often** - Git commit after each feature completes

### Using Ralph

```bash
/ralph-loop      # Start iterative development loop
/cancel-ralph    # Stop current Ralph session
/ralph           # View Ralph documentation
```

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_URL` | App URL (http://localhost:3000) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | No |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | No |

## Deployment

### Google Cloud Platform (Production-Ready)

Mindweave is optimized for deployment on Google Cloud Platform using Cloud Run, Cloud Build, and Cloud SQL.

#### Quick Deploy

```bash
# 1. Setup secrets
pnpm gcp:setup-secrets

# 2. Deploy to Cloud Run
pnpm gcp:deploy
```

#### Manual Deployment

1. **Prerequisites**
   - Google Cloud account with billing enabled
   - gcloud CLI installed
   - Project created in GCP

2. **Setup Cloud SQL (PostgreSQL + pgvector)**
   ```bash
   gcloud sql instances create mindweave-db \
     --database-version=POSTGRES_16 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

3. **Configure Secrets**
   ```bash
   # Create secrets in Secret Manager
   echo -n "your-db-url" | gcloud secrets create database-url --data-file=-
   echo -n "$(openssl rand -base64 32)" | gcloud secrets create auth-secret --data-file=-
   ```

4. **Deploy**
   ```bash
   # Build and deploy with Cloud Build
   gcloud builds submit --config=cloudbuild.yaml
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
   # Use production docker-compose (create your own based on docker/docker-compose.yml)
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
- Try: `pnpm docker:down && pnpm docker:up`

### Database connection errors
- Verify Docker container is running: `docker ps`
- Check connection string in `.env.local`
- Test connection: `psql $DATABASE_URL`

### TypeScript errors
- Run `pnpm type-check` to see all errors
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

- **Documentation**: See [CLAUDE.md](CLAUDE.md) for development guide
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/mindweave/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/yourusername/mindweave/discussions)

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [Claude AI](https://www.anthropic.com/claude) by Anthropic
- [pgvector](https://github.com/pgvector/pgvector) for vector search
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Made with ❤️ using Claude Code**
