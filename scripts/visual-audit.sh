#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCREENSHOTS_DIR="$REPO_ROOT/apps/web/screenshots"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH_NAME="visual-audit/$TIMESTAMP"

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

# ── Phase 2: Claude Code review ─────────────────────────────────────────

echo "▶ Phase 2 — Claude Code visual review"
echo ""

# Ensure the visual-bug label exists
gh label create "visual-bug" \
  --description "Visual/UX bug found by automated visual audit" \
  --color "D93F0B" \
  --force 2>/dev/null || true

MANIFEST_CONTENT=$(cat "$MANIFEST")

cd "$REPO_ROOT"

claude -p \
  --allowedTools "Bash(read-only:*),Read,Write,Edit,Glob,Grep" \
  "You are a senior frontend engineer performing a visual audit of the Mindweave app.

## Screenshots directory
All screenshots are in: $SCREENSHOTS_DIR

## Manifest
$MANIFEST_CONTENT

## Your task

1. **Read each screenshot** (.png file) listed in the manifest using the Read tool.
2. **Review each page** for visual bugs and UX issues. Look for:
   - Overlapping or clipped text
   - Broken layouts (overflows, misaligned elements)
   - Empty states that should show placeholder content
   - Missing or broken images / icons
   - Inconsistent spacing or typography
   - Poor contrast or unreadable text
   - Buttons or links that look disabled but shouldn't be
   - Responsive issues (elements too wide, too narrow)
   - Console errors (listed in manifest) that indicate real problems
3. **For each bug found**, create a GitHub issue:
   \`\`\`
   gh issue create \\
     --title \"[Visual Audit] <short description>\" \\
     --label \"visual-bug\" \\
     --body \"<details including route, what's wrong, and expected behavior>\"
   \`\`\`
4. **If you can fix a bug** directly (CSS, layout, component changes):
   - Create branch: git checkout -b $BRANCH_NAME
   - Make the fix
   - Commit with descriptive message
   - Push and create a PR referencing the issue
5. **Write a summary** of your findings to \`$SCREENSHOTS_DIR/audit-report.md\`

## Guidelines
- Be specific: include the route path and what element is affected
- Not every page needs an issue — only file for real bugs
- Prioritize: broken layouts > missing content > cosmetic issues > minor spacing
- If everything looks good for a page, note it in the report and move on
- Do NOT create issues for things that are clearly intentional design choices
"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Visual Audit Complete"
echo "═══════════════════════════════════════════════════"
