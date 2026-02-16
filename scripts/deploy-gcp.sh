#!/bin/bash

# Mindweave GCP Deployment Script
# Deploys to Google Cloud Run using Cloud Build

set -e

echo "🚀 Mindweave GCP Deployment"
echo "============================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not logged into gcloud. Please run:"
    echo "   gcloud auth login"
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

# Get configuration
read -p "Service name [mindweave]: " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-mindweave}

read -p "Region [us-central1]: " REGION
REGION=${REGION:-us-central1}

echo ""
echo "Configuration:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Project: $PROJECT_ID"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Enable required APIs
echo ""
echo "🔧 Enabling required GCP APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  --project=$PROJECT_ID

echo "✅ APIs enabled"

# Check if secrets exist
echo ""
echo "🔐 Checking secrets in Secret Manager..."

REQUIRED_SECRETS=("google-ai-api-key" "auth-secret" "database-url")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe $secret --project=$PROJECT_ID &>/dev/null; then
        MISSING_SECRETS+=($secret)
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    echo "⚠️  Missing secrets: ${MISSING_SECRETS[*]}"
    echo ""
    echo "Create secrets using:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  echo -n 'your-secret-value' | gcloud secrets create $secret --data-file=- --project=$PROJECT_ID"
    done
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Please create the required secrets first."
        exit 1
    fi
fi

# Submit build to Cloud Build
echo ""
echo "🏗️  Submitting build to Cloud Build..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION \
  --project=$PROJECT_ID

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is available at:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" --project=$PROJECT_ID
echo ""
