import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { cleanDatabase, createTestUser, createTestContent } from '../helpers/db';

/**
 * Visual Audit — Crawls every route, takes full-page screenshots, and writes
 * a JSON manifest that downstream tooling (Claude Code) uses to review for
 * visual / UX bugs.
 */

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../screenshots');

interface RouteManifest {
  route: string;
  screenshotPath: string;
  consoleErrors: string[];
  viewport: { width: number; height: number };
  pageTitle: string;
  loadTimeMs: number;
}

const PUBLIC_ROUTES = ['/', '/login', '/register'];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/capture',
  '/dashboard/library',
  '/dashboard/search',
  '/dashboard/ask',
  '/dashboard/analytics',
  '/dashboard/import',
  '/dashboard/discover',
  '/dashboard/create-post',
  '/dashboard/profile',
  '/dashboard/connections',
  '/dashboard/graph',
  '/dashboard/tasks',
  '/dashboard/wrapped',
];

// Console messages to ignore (not real bugs)
const CONSOLE_NOISE = [
  'favicon',
  'Favicon',
  'sourceMappingURL',
  'DevTools',
  'Download the React DevTools',
  'Third-party cookie',
  'net::ERR_',
];

function isNoise(msg: string): boolean {
  return CONSOLE_NOISE.some((pattern) => msg.includes(pattern));
}

function slugify(route: string): string {
  return route.replace(/\//g, '_').replace(/^_/, '') || 'home';
}

test.describe('Visual Audit', () => {
  const manifest: RouteManifest[] = [];

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    // Write manifest
    const manifestPath = path.join(SCREENSHOTS_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  });

  // ── Public routes (no auth needed) ────────────────────────────────────

  for (const route of PUBLIC_ROUTES) {
    test(`screenshot: ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !isNoise(msg.text())) {
          consoleErrors.push(msg.text());
        }
      });

      const start = Date.now();
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // let animations settle
      const loadTimeMs = Date.now() - start;

      const filename = `${slugify(route)}.png`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const viewport = page.viewportSize() ?? { width: 0, height: 0 };
      const pageTitle = await page.title();

      manifest.push({
        route,
        screenshotPath: `screenshots/${filename}`,
        consoleErrors,
        viewport,
        pageTitle,
        loadTimeMs,
      });
    });
  }

  // ── Protected routes (auth required) ──────────────────────────────────

  test.describe('authenticated pages', () => {
    let userId: string;

    test.beforeAll(async () => {
      await cleanDatabase();

      const user = await createTestUser({
        email: 'visual-audit@mindweave.dev',
        name: 'Visual Audit User',
      });
      userId = user.id;

      // Seed sample content so pages have data to render
      const contentItems = [
        {
          type: 'note' as const,
          title: 'Meeting Notes — Q4 Planning',
          body: 'Discussed roadmap priorities and team allocation for next quarter.',
          tags: ['work', 'planning'],
        },
        {
          type: 'link' as const,
          title: 'Understanding React Server Components',
          url: 'https://example.com/react-server-components',
          tags: ['react', 'learning'],
        },
        {
          type: 'note' as const,
          title: 'Book Highlights — Designing Data-Intensive Apps',
          body: 'Key takeaways on partitioning, replication, and consistency models.',
          tags: ['books', 'engineering'],
        },
        {
          type: 'link' as const,
          title: 'Tailwind CSS Tips and Tricks',
          url: 'https://example.com/tailwind-tips',
          tags: ['css', 'frontend'],
        },
        {
          type: 'note' as const,
          title: 'Weekly Reflection — Feb 2026',
          body: 'This week I shipped the visual audit system and improved test coverage.',
          tags: ['journal', 'reflection'],
        },
      ];

      for (const item of contentItems) {
        await createTestContent(userId, item);
      }
    });

    // Each test logs in fresh (Playwright isolates browser contexts per test)
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'visual-audit@mindweave.dev');
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard', { timeout: 15000 });
    });

    for (const route of PROTECTED_ROUTES) {
      test(`screenshot: ${route}`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error' && !isNoise(msg.text())) {
            consoleErrors.push(msg.text());
          }
        });

        const start = Date.now();
        await page.goto(route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000); // let animations settle
        const loadTimeMs = Date.now() - start;

        const filename = `${slugify(route)}.png`;
        const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const viewport = page.viewportSize() ?? { width: 0, height: 0 };
        const pageTitle = await page.title();

        manifest.push({
          route,
          screenshotPath: `screenshots/${filename}`,
          consoleErrors,
          viewport,
          pageTitle,
          loadTimeMs,
        });
      });
    }
  });
});
