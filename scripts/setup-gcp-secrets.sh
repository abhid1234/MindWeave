#!/bin/bash

# Setup Google Cloud Secret Manager secrets for Mindweave
# Run this script before deploying to Cloud Run

set -e

echo "🔐 Mindweave GCP Secrets Setup"
echo "=============================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Please run:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo ""

# Enable Secret Manager API
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

echo ""
echo "This script will help you create secrets in Google Secret Manager."
echo "Press Enter to use the default value shown in [brackets]."
echo ""

# Function to create or update secret
create_secret() {
    local secret_name=$1
    local prompt_text=$2
    local default_value=$3

    if gcloud secrets describe $secret_name --project=$PROJECT_ID &>/dev/null; then
        echo "⚠️  Secret '$secret_name' already exists."
        read -p "Update it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
        read -sp "$prompt_text [$default_value]: " secret_value
        echo
        secret_value=${secret_value:-$default_value}

        if [ -n "$secret_value" ]; then
            echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=- --project=$PROJECT_ID
            echo "✅ Updated: $secret_name"
        fi
    else
        read -sp "$prompt_text [$default_value]: " secret_value
        echo
        secret_value=${secret_value:-$default_value}

        if [ -n "$secret_value" ]; then
            echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=- --project=$PROJECT_ID
            echo "✅ Created: $secret_name"
        else
            echo "⚠️  Skipped: $secret_name (no value provided)"
        fi
    fi
    echo ""
}

# Create secrets
echo "Creating/updating secrets..."
echo ""

create_secret "database-url" "Database URL (Cloud SQL connection string)" ""
create_secret "auth-secret" "Auth Secret (generate with: openssl rand -base64 32)" ""
create_secret "anthropic-api-key" "Anthropic API Key (from console.anthropic.com)" ""
create_secret "openai-api-key" "OpenAI API Key (from platform.openai.com)" ""

# Optional secrets
echo "Optional secrets (press Enter to skip):"
echo ""

create_secret "google-oauth-client-id" "Google OAuth Client ID" ""
create_secret "google-oauth-client-secret" "Google OAuth Client Secret" ""

echo ""
echo "✅ Secrets setup complete!"
echo ""
echo "Grant Cloud Run access to secrets:"
echo "  gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member='serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com' \\"
echo "    --role='roles/secretmanager.secretAccessor'"
echo ""
echo "Get your project number:"
echo "  gcloud projects describe $PROJECT_ID --format='value(projectNumber)'"
echo ""
