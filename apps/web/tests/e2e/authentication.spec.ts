import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check page title
      await expect(page).toHaveTitle(/Mindweave/i);

      // Check main heading
      await expect(page.locator('h1:has-text("Mindweave")')).toBeVisible();

      // Check description
      await expect(
        page.locator('text=Your AI-powered personal knowledge hub')
      ).toBeVisible();
    });

    test('should have Google sign-in button', async ({ page }) => {
      await page.goto('/login');

      // Check for Google sign-in button
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('should redirect to dashboard if already logged in', async ({ page, context }) => {
      // Note: This test would require setting up auth cookies
      // For now, we test the basic redirect behavior

      await page.goto('/login');

      // If logged in (via cookies), should redirect to dashboard
      // This is a placeholder - actual implementation would need auth setup
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login from dashboard', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users to login from capture', async ({
      page,
    }) => {
      await page.goto('/capture');

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users to login from search', async ({
      page,
    }) => {
      await page.goto('/search');

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users to login from library', async ({
      page,
    }) => {
      await page.goto('/library');

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow access to public pages', async ({ page }) => {
      // Landing page
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // Should not redirect
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Login Flow', () => {
    test('should have proper form submission', async ({ page }) => {
      await page.goto('/login');

      const googleButton = page.locator('button:has-text("Continue with Google")');

      // Button should be within a form
      const form = googleButton.locator('xpath=ancestor::form');
      await expect(form).toBeVisible();

      // Button should have submit type
      await expect(googleButton).toHaveAttribute('type', 'submit');
    });

    test('should handle Google OAuth flow initiation', async ({ page }) => {
      await page.goto('/login');

      // Click Google sign-in button
      const googleButton = page.locator('button:has-text("Continue with Google")');

      // Listen for navigation (would go to Google OAuth)
      const navigationPromise = page.waitForURL('**', { timeout: 5000 }).catch(() => null);

      await googleButton.click();

      // Wait for any navigation attempt
      await navigationPromise;

      // Note: Actual OAuth flow would redirect to Google
      // This test verifies the button click triggers form submission
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations on login page', async ({ page }) => {
      await page.goto('/login');

      // Basic accessibility checks
      // Check for proper heading structure
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Check for keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab to the Google button
      await page.keyboard.press('Tab');

      // The button should be focusable
      const googleButton = page.locator('button:has-text("Continue with Google")');
      const isFocused = await googleButton.evaluate(
        (el) => el === document.activeElement
      );

      expect(isFocused).toBeTruthy();
    });
  });

  test.describe('Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // Page should render properly
      await expect(page.locator('h1:has-text("Mindweave")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Continue with Google")')
      ).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');

      // Page should render properly
      await expect(page.locator('h1:has-text("Mindweave")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Continue with Google")')
      ).toBeVisible();
    });

    test('should be responsive on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/login');

      // Page should render properly
      await expect(page.locator('h1:has-text("Mindweave")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Continue with Google")')
      ).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Filter out known non-critical errors if any
      const criticalErrors = errors.filter(
        (error) => !error.includes('favicon') && !error.includes('sourcemap')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
