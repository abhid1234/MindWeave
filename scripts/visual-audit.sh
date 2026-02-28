#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCREENSHOTS_DIR="$REPO_ROOT/apps/web/screenshots"
echo "═══════════════════════════════════════════════════"
echo "  Mindweave Visual Audit System"
echo "  $(date)"
echo "═══════════════════════════════════════════════════"

# ── Phase 1: Capture screenshots ─────────────────────────────────────────

echo ""
echo "▶ Phase 1 — Capturing screenshots"
echo ""

# Clean previous screenshots
rm -rf "$SCREENSHOTS_DIR"
mkdir -p "$SCREENSHOTS_DIR"

cd "$REPO_ROOT/apps/web"
pnpm exec playwright test --config=playwright.visual-audit.config.ts

MANIFEST="$SCREENSHOTS_DIR/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "✗ manifest.json not found — Playwright run may have failed"
  exit 1
fi

ROUTE_COUNT=$(jq length "$MANIFEST")
echo ""
echo "✓ Captured $ROUTE_COUNT screenshots"
echo ""

# ── Phase 2: Gemini Vision review ────────────────────────────────────────

echo "▶ Phase 2 — Gemini Vision visual review"
echo ""

# Ensure the visual-bug label exists
gh label create "visual-bug" \
  --description "Visual/UX bug found by automated visual audit" \
  --color "D93F0B" \
  --force 2>/dev/null || true

cd "$REPO_ROOT"

npx tsx scripts/visual-audit-review.ts

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Visual Audit Complete"
echo "═══════════════════════════════════════════════════"
