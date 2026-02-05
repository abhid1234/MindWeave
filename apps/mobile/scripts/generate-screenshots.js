/**
 * Play Store Screenshot Generator for Mindweave
 *
 * Uses Playwright to capture screenshots at Pixel 7 dimensions (1080x2400)
 * for the Google Play Store listing.
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Usage:
 *   SESSION_COOKIE="your-auth-session-cookie" APP_URL="https://mindweave.space" node scripts/generate-screenshots.js
 *
 * Environment variables:
 *   SESSION_COOKIE - Auth session cookie value (required for authenticated pages)
 *   APP_URL        - Base URL of the app (default: http://localhost:3000)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SESSION_COOKIE = process.env.SESSION_COOKIE;

// Pixel 7 dimensions
const VIEWPORT = { width: 1080, height: 2400 };
const DEVICE_SCALE_FACTOR = 1; // Already at native resolution

const OUTPUT_DIR = path.join(__dirname, '../store-assets/screenshots');

// Pages to screenshot (in order for Play Store listing)
const PAGES = [
  {
    name: '01-dashboard',
    path: '/dashboard',
    description: 'Dashboard overview with stats and recommendations',
    waitFor: '[data-testid="dashboard"], main',
  },
  {
    name: '02-capture',
    path: '/dashboard/capture',
    description: 'Content capture form',
    waitFor: 'form, [data-testid="capture-form"], main',
  },
  {
    name: '03-library',
    path: '/dashboard/library',
    description: 'Library with filters and content cards',
    waitFor: '[data-testid="content-card"], [data-testid="library"], main',
  },
  {
    name: '04-search',
    path: '/dashboard/search',
    description: 'Semantic search interface',
    waitFor: '[data-testid="search-form"], input[type="search"], main',
  },
  {
    name: '05-ask',
    path: '/dashboard/ask',
    description: 'AI Knowledge Q&A chat',
    waitFor: '[data-testid="qa-chat"], textarea, main',
  },
];

async function generateScreenshots() {
  if (!SESSION_COOKIE) {
    console.error('Error: SESSION_COOKIE environment variable is required.');
    console.error('');
    console.error('Get it from your browser:');
    console.error('  1. Log in to Mindweave');
    console.error('  2. Open DevTools → Application → Cookies');
    console.error('  3. Copy the "authjs.session-token" cookie value');
    console.error('');
    console.error('Usage:');
    console.error('  SESSION_COOKIE="your-cookie" node scripts/generate-screenshots.js');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Generating Play Store screenshots...');
  console.log(`  App URL: ${APP_URL}`);
  console.log(`  Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
  });

  // Set auth cookie
  const cookieDomain = new URL(APP_URL).hostname;
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: SESSION_COOKIE,
      domain: cookieDomain,
      path: '/',
      httpOnly: true,
      secure: APP_URL.startsWith('https'),
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  for (const pageConfig of PAGES) {
    const url = `${APP_URL}${pageConfig.path}`;
    const outputPath = path.join(OUTPUT_DIR, `${pageConfig.name}.png`);

    console.log(`  Capturing: ${pageConfig.description}`);
    console.log(`    URL: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for the main content to load
      try {
        await page.waitForSelector(pageConfig.waitFor, { timeout: 10000 });
      } catch {
        console.log(`    Warning: Selector "${pageConfig.waitFor}" not found, capturing anyway`);
      }

      // Extra delay for animations/rendering
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false,
      });

      console.log(`    Saved: ${pageConfig.name}.png`);
    } catch (error) {
      console.error(`    Error capturing ${pageConfig.name}: ${error.message}`);
    }
  }

  await browser.close();

  console.log('');
  console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
  console.log('Upload these to Google Play Console → Store listing → Phone screenshots');
}

generateScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
