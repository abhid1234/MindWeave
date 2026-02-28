#!/usr/bin/env tsx
/**
 * Visual Audit Review — Gemini Vision
 *
 * Reads screenshots + manifest.json produced by Playwright,
 * sends each screenshot to Gemini 2.0 Flash for visual review,
 * files GitHub issues for bugs found, and writes audit-report.md.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Types ────────────────────────────────────────────────────────────────

interface RouteManifest {
  route: string;
  screenshotPath: string;
  consoleErrors: string[];
  viewport: { width: number; height: number };
  pageTitle: string;
  loadTimeMs: number;
}

interface Issue {
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface ReviewResult {
  issues: Issue[];
  looks_good: boolean;
}

// ── Config ───────────────────────────────────────────────────────────────

const SCREENSHOTS_DIR = path.resolve(__dirname, '../apps/web/screenshots');
const MANIFEST_PATH = path.join(SCREENSHOTS_DIR, 'manifest.json');
const REPORT_PATH = path.join(SCREENSHOTS_DIR, 'audit-report.md');
const GEMINI_MODEL = 'gemini-2.5-flash';

const REVIEW_PROMPT = `You are a senior frontend engineer performing a visual audit of a web application screenshot.

Review this page for visual bugs and UX issues. Look for:
- Overlapping or clipped text
- Broken layouts (overflows, misaligned elements)
- Empty states that should show placeholder content
- Missing or broken images / icons
- Inconsistent spacing or typography
- Poor contrast or unreadable text
- Buttons or links that look disabled but shouldn't be
- Responsive issues (elements too wide, too narrow)

Guidelines:
- Only report real bugs, not intentional design choices
- Be specific about what element is affected and where on the page
- Prioritize: broken layouts > missing content > cosmetic issues > minor spacing

Respond with ONLY valid JSON (no markdown fences) in this exact format:
{
  "issues": [
    {
      "title": "Short description of the issue",
      "severity": "high" | "medium" | "low",
      "description": "Detailed description of what is wrong and expected behavior"
    }
  ],
  "looks_good": true/false
}

If everything looks fine, return: { "issues": [], "looks_good": true }`;

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('✗ GOOGLE_AI_API_KEY is not set');
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('✗ manifest.json not found at', MANIFEST_PATH);
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const manifest: RouteManifest[] = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, 'utf-8'),
  );

  console.log(`Reviewing ${manifest.length} screenshots with Gemini Vision...\n`);

  const reportLines: string[] = [
    '# Visual Audit Report',
    '',
    `**Date:** ${new Date().toISOString()}`,
    `**Model:** ${GEMINI_MODEL}`,
    `**Routes reviewed:** ${manifest.length}`,
    '',
    '---',
    '',
  ];

  let totalIssues = 0;
  let routesWithIssues = 0;

  for (const entry of manifest) {
    const screenshotFile = path.resolve(SCREENSHOTS_DIR, path.basename(entry.screenshotPath));

    if (!fs.existsSync(screenshotFile)) {
      console.warn(`⚠ Screenshot not found: ${screenshotFile}, skipping`);
      continue;
    }

    console.log(`  Reviewing: ${entry.route}`);

    const imageBase64 = fs.readFileSync(screenshotFile).toString('base64');

    // Build context about the page for Gemini
    const context = [
      `Route: ${entry.route}`,
      `Page title: ${entry.pageTitle}`,
      `Viewport: ${entry.viewport.width}x${entry.viewport.height}`,
      `Load time: ${entry.loadTimeMs}ms`,
    ];
    if (entry.consoleErrors.length > 0) {
      context.push(`Console errors: ${entry.consoleErrors.join('; ')}`);
    }

    const prompt = `${REVIEW_PROMPT}\n\nPage context:\n${context.join('\n')}`;

    let review: ReviewResult;
    try {
      const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType: 'image/png' } },
        prompt,
      ]);

      const responseText = result.response.text().trim();
      // Strip markdown fences if present
      const jsonText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      review = JSON.parse(jsonText);
    } catch (err) {
      console.warn(`  ⚠ Failed to review ${entry.route}: ${err}`);
      reportLines.push(`## ${entry.route}`, '', '> Review failed — see CI logs for details.', '');
      continue;
    }

    // Write report section
    reportLines.push(`## ${entry.route}`);
    reportLines.push('');
    if (entry.consoleErrors.length > 0) {
      reportLines.push(`**Console errors:** ${entry.consoleErrors.join(', ')}`);
    }
    reportLines.push(`**Load time:** ${entry.loadTimeMs}ms`);
    reportLines.push('');

    if (review.looks_good && review.issues.length === 0) {
      reportLines.push('✅ No issues found.', '');
      console.log(`    ✓ Looks good`);
    } else {
      routesWithIssues++;
      for (const issue of review.issues) {
        totalIssues++;
        const severityBadge =
          issue.severity === 'high' ? '🔴' :
          issue.severity === 'medium' ? '🟡' : '🟢';

        reportLines.push(
          `- ${severityBadge} **[${issue.severity.toUpperCase()}]** ${issue.title}`,
          `  ${issue.description}`,
          '',
        );

        console.log(`    ${severityBadge} [${issue.severity}] ${issue.title}`);

        // Create GitHub issues for high/medium severity
        if (issue.severity === 'high' || issue.severity === 'medium') {
          createGitHubIssue(entry.route, issue);
        }
      }
    }
  }

  // Write summary at the top
  reportLines.splice(7, 0,
    `**Total issues:** ${totalIssues}`,
    `**Routes with issues:** ${routesWithIssues}/${manifest.length}`,
    '',
  );

  fs.writeFileSync(REPORT_PATH, reportLines.join('\n'));

  console.log(`\n✓ Audit complete: ${totalIssues} issues found across ${routesWithIssues} routes`);
  console.log(`  Report: ${REPORT_PATH}`);
}

function createGitHubIssue(route: string, issue: Issue) {
  const title = `[Visual Audit] ${issue.title}`;
  const body = [
    `**Route:** \`${route}\``,
    `**Severity:** ${issue.severity}`,
    '',
    issue.description,
    '',
    '---',
    '*Automated by Mindweave Visual Audit System (Gemini Vision)*',
  ].join('\n');

  try {
    execSync(
      `gh issue create --title "${title.replace(/"/g, '\\"')}" --label "visual-bug" --body "${body.replace(/"/g, '\\"')}"`,
      { stdio: 'pipe' },
    );
    console.log(`    → Created GitHub issue`);
  } catch (err) {
    console.warn(`    ⚠ Failed to create issue: ${err}`);
  }
}

main().catch((err) => {
  console.error('✗ Visual audit review failed:', err);
  process.exit(1);
});
