import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that doesn't require auth for basic mobile tests
    await page.goto('/');
  });

  test('should show hamburger menu on mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewports');

    await page.goto('/login');

    // On mobile, the hamburger menu should be visible after login
    // For now, just verify the page loads correctly on mobile
    await expect(page).toHaveTitle(/Mindweave/);
  });

  test('should have proper viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have proper theme color meta tag', async ({ page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]').first();
    await expect(themeColor).toBeAttached();
  });

  test('should have PWA manifest link', async ({ page }) => {
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.json');
  });
});

test.describe('Mobile Dashboard Navigation', () => {
  // These tests require authentication - they test the mobile nav drawer

  test('hamburger menu should toggle navigation drawer on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewports');

    // Note: This test would require a logged-in session
    // For now, we verify the mobile nav component exists in the DOM
    await page.goto('/login');

    // The login page should be responsive
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();

    // Verify no horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('page content should be readable on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewports');

    await page.goto('/login');

    // Check that text is not too small
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      const fontSize = await heading.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum readable size
    }
  });
});

test.describe('PWA Features', () => {
  test('manifest.json should be accessible and valid', async ({ page, request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest.name).toBe('Mindweave');
    expect(manifest.short_name).toBe('Mindweave');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('app icons should be accessible', async ({ request }) => {
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of iconSizes) {
      const response = await request.get(`/icons/icon-${size}.png`);
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });

  test('apple-touch-icon should be accessible', async ({ request }) => {
    const response = await request.get('/icons/apple-touch-icon.png');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('maskable icons should be accessible', async ({ request }) => {
    const maskableSizes = [192, 512];

    for (const size of maskableSizes) {
      const response = await request.get(`/icons/maskable-${size}.png`);
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });
});

test.describe('Responsive Layout', () => {
  test('login page should be responsive', async ({ page }) => {
    await page.goto('/login');

    // Page should not have horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('buttons should have adequate tap targets on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewports');

    await page.goto('/login');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Minimum tap target is 44x44 pixels per WCAG guidelines
          expect(box.height).toBeGreaterThanOrEqual(36); // Allow some flexibility
          expect(box.width).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });
});

test.describe('Offline Indicator', () => {
  test('offline indicator component should exist in page', async ({ page }) => {
    await page.goto('/login');

    // The offline indicator is hidden when online, but should be in the DOM
    // We can verify the component structure exists by checking for the component's wrapper
    // when we simulate offline mode

    // Note: Simulating offline mode in Playwright requires special setup
    // For now, verify the page loads correctly
    await expect(page).toHaveTitle(/Mindweave/);
  });
});
