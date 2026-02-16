#!/bin/bash

# Mindweave Development Setup Script
# This script sets up the development environment for Mindweave

set -e

echo "🚀 Mindweave Development Setup"
echo "================================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm@9.5.0
    echo "✅ pnpm installed successfully"
else
    echo "✅ pnpm is already installed"
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current version: $(node -v)"
    echo "   Please upgrade Node.js and try again."
    exit 1
fi
echo "✅ Node.js version is compatible: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Docker is not running. Please start Docker and run:"
    echo "   pnpm docker:up"
else
    echo ""
    echo "🐳 Starting Docker services..."
    pnpm docker:up

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5

    # Check if database is accessible
    if docker exec mindweave-postgres pg_isready -U mindweave > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"

        # Run database migrations
        echo ""
        echo "🗄️  Running database migrations..."
        cd apps/web && pnpm db:generate && pnpm db:push && cd ../..
        echo "✅ Database migrations completed"
    else
        echo "⚠️  PostgreSQL is not ready yet. Please wait and run:"
        echo "   cd apps/web && pnpm db:generate && pnpm db:push"
    fi
fi

# Check environment variables
echo ""
echo "🔑 Checking environment variables..."
if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in apps/web/.env.local:"
    echo "   1. Generate AUTH_SECRET: openssl rand -base64 32"
    echo "   2. Add your GOOGLE_AI_API_KEY from https://aistudio.google.com/app/apikey"
    echo "   3. (Optional) Add Google OAuth credentials"
else
    echo "✅ .env.local exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in apps/web/.env.local"
echo "2. Start the development server: pnpm dev"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"
