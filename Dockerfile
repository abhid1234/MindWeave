# Dockerfile for Next.js production builds
# Optimized for Google Cloud Run deployment

FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@9.5.0

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Drizzle types and build Next.js
WORKDIR /app/apps/web
RUN pnpm db:generate
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port (Cloud Run uses PORT env var)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js server
CMD ["node", "apps/web/server.js"]
