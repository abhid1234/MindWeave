---
name: deploy
description: Build and deploy Mindweave to Google Cloud Run
disable-model-invocation: true
---

Deploy Mindweave to Cloud Run. Follow these steps:

1. Check for uncommitted changes with `git status`. If there are changes, ask the user if they want to commit first.
2. Get the short SHA: `git rev-parse --short HEAD`
3. Submit the build:
   ```
   gcloud builds submit --config=cloudbuild.yaml --substitutions=_SERVICE_NAME=mindweave,_REGION=us-central1,SHORT_SHA=<sha> --project=mindweave-prod
   ```
4. Wait for the build to complete (run in background, ~10 min on E2_MEDIUM).
5. Report the result: image name, build duration, and status.

If $ARGUMENTS contains "status", just check the latest build status instead of deploying:
```
gcloud builds list --limit=1 --project=mindweave-prod
```
