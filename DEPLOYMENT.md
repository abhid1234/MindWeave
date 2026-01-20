# Mindweave GCP Deployment Guide

Complete guide for deploying Mindweave to Google Cloud Platform using Cloud Run, Cloud Build, and Cloud SQL.

## Architecture Overview

- **Application**: Next.js on Google Cloud Run (serverless containers)
- **Database**: Cloud SQL for PostgreSQL with pgvector
- **Container Registry**: Google Container Registry (GCR)
- **CI/CD**: Google Cloud Build
- **Secrets**: Google Secret Manager
- **Storage**: Cloud Storage (for future file uploads)

## Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed ([install guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed locally (for testing)
4. **Project created** in Google Cloud Console

## Initial Setup

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Get your project ID
gcloud config get-value project
```

### 2. Enable Required APIs

```bash
# Enable all required GCP services
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com
```

### 3. Set Up Cloud SQL Database

#### Create PostgreSQL Instance

```bash
# Create Cloud SQL instance with pgvector support
gcloud sql instances create mindweave-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD \
  --database-flags=cloudsql.iam_authentication=on

# Create database
gcloud sql databases create mindweave_prod \
  --instance=mindweave-db

# Create user
gcloud sql users create mindweave \
  --instance=mindweave-db \
  --password=YOUR_DB_PASSWORD
```

#### Enable pgvector Extension

```bash
# Connect to database
gcloud sql connect mindweave-db --user=postgres

# In psql prompt:
\c mindweave_prod
CREATE EXTENSION IF NOT EXISTS vector;
\dx  # Verify extension is installed
\q
```

#### Get Connection String

```bash
# Get connection name (format: PROJECT:REGION:INSTANCE)
gcloud sql instances describe mindweave-db --format="value(connectionName)"

# Your DATABASE_URL will be:
# postgresql://mindweave:PASSWORD@/mindweave_prod?host=/cloudsql/PROJECT:REGION:INSTANCE
```

### 4. Configure Secrets in Secret Manager

Use the helper script:

```bash
# Run the secrets setup script
pnpm gcp:setup-secrets

# Or manually create each secret:
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "$(openssl rand -base64 32)" | gcloud secrets create auth-secret --data-file=-
echo -n "your-anthropic-key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your-openai-key" | gcloud secrets create openai-api-key --data-file=-
echo -n "your-google-oauth-id" | gcloud secrets create google-oauth-client-id --data-file=-
echo -n "your-google-oauth-secret" | gcloud secrets create google-oauth-client-secret --data-file=-
```

#### Grant Cloud Run Access to Secrets

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant secret accessor role to Cloud Run service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Deployment

### Option 1: Automated Deployment (Recommended)

Use the deployment script for a guided deployment:

```bash
# Run the deployment script
pnpm gcp:deploy

# Follow the prompts:
# - Service name (default: mindweave)
# - Region (default: us-central1)
# - Confirm deployment
```

The script will:
1. Enable required APIs
2. Check for required secrets
3. Submit build to Cloud Build
4. Deploy to Cloud Run
5. Display your application URL

### Option 2: Manual Deployment

#### Build and Deploy with Cloud Build

```bash
# Submit build and deploy
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=mindweave,_REGION=us-central1
```

#### Or Deploy Locally Built Image

```bash
# Build Docker image locally
docker build \
  --build-arg DATABASE_URL="your-connection-string" \
  --build-arg NEXT_PUBLIC_APP_URL="https://your-service-url.run.app" \
  -t gcr.io/YOUR_PROJECT_ID/mindweave:latest \
  .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/mindweave:latest

# Deploy to Cloud Run
gcloud run deploy mindweave \
  --image=gcr.io/YOUR_PROJECT_ID/mindweave:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets=DATABASE_URL=database-url:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,AUTH_SECRET=auth-secret:latest
```

### Option 3: Deploy with Service YAML

```bash
# Update cloud-run-service.yaml with your project details
# Then deploy:
gcloud run services replace cloud-run-service.yaml --region=us-central1
```

## Post-Deployment

### 1. Run Database Migrations

```bash
# Connect via Cloud SQL Proxy
cloud-sql-proxy YOUR_PROJECT:us-central1:mindweave-db &

# In another terminal, run migrations from local
cd apps/web
DATABASE_URL="postgresql://mindweave:password@localhost:5432/mindweave_prod" pnpm db:push
```

### 2. Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe mindweave --region=us-central1 --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/api/health

# Visit in browser
echo "Visit: $SERVICE_URL"
```

### 3. Configure OAuth Redirect URLs

Update your Google OAuth app with the production callback URL:

```
https://your-service-name-region.run.app/api/auth/callback/google
```

## CI/CD with Cloud Build Triggers

### Set Up Automatic Deployment

```bash
# Create a build trigger (from GitHub)
gcloud builds triggers create github \
  --name=mindweave-deploy \
  --repo-name=mindweave \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=mindweave,_REGION=us-central1
```

Now every push to `main` will trigger an automatic deployment!

## Monitoring & Logs

### View Logs

```bash
# View Cloud Run logs
gcloud run services logs read mindweave --region=us-central1 --limit=50

# Stream logs in real-time
gcloud run services logs tail mindweave --region=us-central1

# View build logs
gcloud builds list --limit=10
gcloud builds log BUILD_ID
```

### Metrics & Monitoring

- **Cloud Console**: https://console.cloud.google.com/run
- **Logs Explorer**: https://console.cloud.google.com/logs
- **Metrics**: CPU, memory, request count, latency

### Set Up Alerts

```bash
# Create alert for error rate
# (Use Cloud Console UI for easier configuration)
```

## Scaling Configuration

### Update Scaling Settings

```bash
# Update min/max instances
gcloud run services update mindweave \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=10

# Update CPU and memory
gcloud run services update mindweave \
  --region=us-central1 \
  --cpu=1 \
  --memory=512Mi

# Update concurrency
gcloud run services update mindweave \
  --region=us-central1 \
  --concurrency=80
```

### Cost Optimization

- **Min instances = 0**: No cost when idle (cold starts may occur)
- **Min instances = 1**: Always ready (costs ~$10-20/month for db-f1-micro)
- **Cloud SQL**: Use smallest tier for development, scale up as needed

## Environment Management

### Development, Staging, Production

Create separate services for each environment:

```bash
# Development
gcloud run deploy mindweave-dev --image=gcr.io/PROJECT/mindweave:dev

# Staging
gcloud run deploy mindweave-staging --image=gcr.io/PROJECT/mindweave:staging

# Production
gcloud run deploy mindweave-prod --image=gcr.io/PROJECT/mindweave:latest
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
gcloud run services logs tail mindweave --region=us-central1

# Common issues:
# 1. Missing secrets - verify in Secret Manager
# 2. Database connection - check Cloud SQL connection string
# 3. Build failed - check Cloud Build logs
```

### Database Connection Issues

```bash
# Test Cloud SQL connection locally
gcloud sql connect mindweave-db --user=mindweave

# Verify service account has permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*compute@developer.gserviceaccount.com"
```

### Secrets Not Loading

```bash
# Verify secrets exist
gcloud secrets list

# Check service account permissions
gcloud secrets get-iam-policy database-url

# Grant access if needed
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Cost Estimates

### Monthly Costs (Light Usage)

- **Cloud Run**: $0-5 (pay per request, free tier available)
- **Cloud SQL**: $7-10 (db-f1-micro instance)
- **Cloud Build**: Free tier (120 build-minutes/day)
- **Container Registry**: $0.26/GB stored
- **Secret Manager**: $0.06 per 10,000 accesses

**Total**: ~$10-20/month for personal use

### Production Scaling

- **Cloud Run**: ~$50/month (1M requests)
- **Cloud SQL**: $50-200/month (db-g1-small or larger)
- **Load balancer**: $18/month (if using custom domain with HTTPS)

## Backup & Disaster Recovery

### Database Backups

```bash
# Enable automated backups
gcloud sql instances patch mindweave-db \
  --backup-start-time=03:00 \
  --enable-bin-log

# Create manual backup
gcloud sql backups create --instance=mindweave-db
```

### Restore from Backup

```bash
# List backups
gcloud sql backups list --instance=mindweave-db

# Restore
gcloud sql backups restore BACKUP_ID --backup-instance=mindweave-db
```

## Custom Domain

### Map Custom Domain

```bash
# Verify domain ownership
gcloud domains verify DOMAIN

# Map domain to Cloud Run
gcloud run domain-mappings create \
  --service=mindweave \
  --domain=app.yourdomain.com \
  --region=us-central1
```

## Security Best Practices

1. **Use Secret Manager** for all sensitive data
2. **Enable Cloud Armor** for DDoS protection
3. **Configure IAM** with least privilege
4. **Enable audit logging**
5. **Use VPC connectors** for private Cloud SQL access
6. **Implement rate limiting** in application code

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Guide](https://cloud.google.com/secret-manager/docs)
- [Next.js on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service)
