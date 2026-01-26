import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that page is accessible
    await expect(page).toHaveTitle(/Mindweave/i);
  });

  test('should have main heading', async ({ page }) => {
    await page.goto('/');

    // Look for main heading or title
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Allow small pixel differences due to anti-aliasing, font rendering, etc.
    const screenshotOptions = {
      fullPage: false,
      maxDiffPixelRatio: 0.02, // Allow up to 2% pixel difference
    };

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-desktop.png', screenshotOptions);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-tablet.png', screenshotOptions);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-mobile.png', screenshotOptions);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links (if they exist)
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    if (count > 0) {
      // Verify first link is clickable
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    // Expected 404s that are not actual errors (browser auto-requests, optional resources)
    const expected404Patterns = [
      /favicon\.ico/i,
      /Failed to load resource.*404/i,
      /net::ERR_/i,
    ];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected 404 errors (browser auto-requests favicon, etc.)
        const isExpected404 = expected404Patterns.some((pattern) => pattern.test(text));
        if (!isExpected404) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify no unexpected console errors
    expect(errors).toHaveLength(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check for description meta tag (if it exists)
    const description = page.locator('meta[name="description"]');
    if ((await description.count()) > 0) {
      await expect(description).toHaveAttribute('content', /.+/);
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    // Check for main landmark
    const main = page.locator('main');
    if ((await main.count()) > 0) {
      await expect(main).toBeVisible();
    }

    // Check that interactive elements are keyboard accessible
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
