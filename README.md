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
- **Embeddings**: OpenAI text-embedding-3-small
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

### Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler
npm run format           # Format code with Prettier

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

1. **AI API** (Required for AI features)
   - Create API key from your provider
   - Add to `.env.local` as `ANTHROPIC_API_KEY`

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
- [x] Docker PostgreSQL setup
- [ ] Authentication (Google OAuth)
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
| `ANTHROPIC_API_KEY` | AI API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
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

- **Documentation**: See [CLAUDE.md](CLAUDE.md) for development guide
- **Issues**: Report bugs on [GitHub Issues](https://github.com/abhid1234/MindWeave/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/abhid1234/MindWeave/discussions)

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [pgvector](https://github.com/pgvector/pgvector) for vector search
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
