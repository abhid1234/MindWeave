#!/bin/bash

# Setup Neo4j AuraDB for Mindweave
# Run after creating a Neo4j AuraDB instance at https://console.neo4j.io

set -e

echo "Neo4j AuraDB Setup for Mindweave"
echo "================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "gcloud CLI is not installed."
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "No GCP project set. Please run:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Project: $PROJECT_ID"
echo ""
echo "Prerequisites:"
echo "  1. Create a free Neo4j AuraDB instance at https://console.neo4j.io"
echo "  2. Have the connection URI, username, and password ready"
echo ""

# Prompt for Neo4j credentials
read -p "Neo4j URI (e.g., neo4j+s://abc123.databases.neo4j.io): " NEO4J_URI
if [ -z "$NEO4J_URI" ]; then
    echo "Neo4j URI is required."
    exit 1
fi

read -p "Neo4j Username [neo4j]: " NEO4J_USER
NEO4J_USER=${NEO4J_USER:-neo4j}

read -sp "Neo4j Password: " NEO4J_PASSWORD
echo
if [ -z "$NEO4J_PASSWORD" ]; then
    echo "Neo4j Password is required."
    exit 1
fi

echo ""
echo "Updating secrets in GCP Secret Manager..."

# Update secrets
echo -n "$NEO4J_URI" | gcloud secrets versions add neo4j-uri --data-file=- --project=$PROJECT_ID
echo "  Updated: neo4j-uri"

echo -n "$NEO4J_USER" | gcloud secrets versions add neo4j-user --data-file=- --project=$PROJECT_ID
echo "  Updated: neo4j-user"

echo -n "$NEO4J_PASSWORD" | gcloud secrets versions add neo4j-password --data-file=- --project=$PROJECT_ID
echo "  Updated: neo4j-password"

# Check if CRON_SECRET exists and has a real value
CRON_VAL=$(gcloud secrets versions access latest --secret=cron-secret --project=$PROJECT_ID 2>/dev/null || echo "")
if [ -z "$CRON_VAL" ] || [ "$CRON_VAL" = "not-configured" ]; then
    CRON_SECRET=$(openssl rand -base64 32)
    echo -n "$CRON_SECRET" | gcloud secrets versions add cron-secret --data-file=- --project=$PROJECT_ID
    echo "  Generated and stored: cron-secret"
else
    CRON_SECRET=$CRON_VAL
    echo "  cron-secret already configured"
fi

echo ""
echo "Secrets updated. Next steps:"
echo ""
echo "  1. Redeploy to Cloud Run:"
echo "     pnpm gcp:deploy"
echo ""
echo "  2. After deploy, trigger a full sync for your user:"
echo "     curl -X POST https://mindweave.space/api/neo4j/sync \\"
echo "       -H 'Authorization: Bearer $CRON_SECRET' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"userId\": \"YOUR_USER_ID\"}'"
echo ""
echo "  Or sign in to the app and trigger sync from the browser:"
echo "     fetch('/api/neo4j/sync', { method: 'POST' })"
echo ""
