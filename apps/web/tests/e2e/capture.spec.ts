import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser } from '../helpers/db';

test.describe('Capture Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clean database before each test
    await cleanDatabase();

    // Create test user and log in
    const testUser = await createTestUser({
      email: 'test@mindweave.dev',
      name: 'Test User',
    });

    // Navigate to login page
    await page.goto('/login');

    // Login with dev credentials
    await page.fill('input[name="email"]', 'test@mindweave.dev');
    await page.click('button[type="submit"]:has-text("Dev Login")');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test.describe('Navigation', () => {
    test('should navigate to capture page from dashboard', async ({ page }) => {
      // Click on Capture in navigation
      await page.click('a[href="/dashboard/capture"]');

      // Should be on capture page
      await expect(page).toHaveURL('/dashboard/capture');
      await expect(page.getByRole('heading', { name: 'Capture', level: 1 })).toBeVisible();
    });

    test('should navigate to capture page from quick action', async ({ page }) => {
      // Click on Quick Capture card
      await page.click('a[href="/dashboard/capture"]:has-text("Quick Capture")');

      // Should be on capture page
      await expect(page).toHaveURL('/dashboard/capture');
    });
  });

  test.describe('Form Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should display all form fields', async ({ page }) => {
      await expect(page.locator('select[name="type"]')).toBeVisible();
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="body"]')).toBeVisible();
      // URL field only visible when type is "link"
      await expect(page.locator('input[name="tags"]')).toBeVisible();
    });

    test('should have correct default values', async ({ page }) => {
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toHaveValue('note');
    });

    test('should display submit and cancel buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
      await expect(page.locator('a:has-text("Cancel")')).toBeVisible();
    });
  });

  test.describe('Creating Notes', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should create a simple note', async ({ page }) => {
      // Fill in the form
      await page.selectOption('select[name="type"]', 'note');
      await page.fill('input[name="title"]', 'My First Note');
      await page.fill('textarea[name="body"]', 'This is the content of my first note.');

      // Submit the form
      await page.click('button[type="submit"]:has-text("Save")');

      // Should see success message in toast notification (exclude Next.js route announcer)
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');

      // Should redirect to library (1s delay in code + navigation time)
      await page.waitForURL('/dashboard/library', { timeout: 10000 });
    });

    test('should create a note with tags', async ({ page }) => {
      await page.fill('input[name="title"]', 'Tagged Note');
      await page.fill('textarea[name="body"]', 'Content with tags');
      await page.fill('input[name="tags"]', 'important, work, project');

      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
    });

    test('should create a note with minimal information', async ({ page }) => {
      await page.fill('input[name="title"]', 'Minimal Note');

      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
    });

    test('should create a note with special characters', async ({ page }) => {
      await page.fill('input[name="title"]', 'Note with <special> & "characters"');
      await page.fill('textarea[name="body"]', 'Content with émojis 🎉 and symbols: @#$%');

      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
    });
  });

  test.describe('Creating Links', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should create a link with URL', async ({ page }) => {
      await page.selectOption('select[name="type"]', 'link');
      await page.fill('input[name="title"]', 'Useful Resource');
      await page.fill('input[name="url"]', 'https://example.com');
      await page.fill('input[name="tags"]', 'resource, web');

      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
    });

    test('should create a link with notes', async ({ page }) => {
      await page.selectOption('select[name="type"]', 'link');
      await page.fill('input[name="title"]', 'Article to Read');
      await page.fill('input[name="url"]', 'https://blog.example.com/article');
      await page.fill('textarea[name="body"]', 'Notes about why this article is important');

      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
    });
  });

  test.describe('Creating File Entries', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should create a file entry', async ({ page }) => {
      await page.selectOption('select[name="type"]', 'file');

      // Upload a synthetic text file via the hidden file input
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'Important Document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is the content of the important document.'),
      });

      // Wait for upload to complete (file preview appears)
      await expect(page.locator('text=Important Document.txt')).toBeVisible({ timeout: 10000 });

      await page.fill('input[name="title"]', 'Important Document');
      await page.fill('textarea[name="body"]', 'Summary of the document contents');
      await page.fill('input[name="tags"]', 'document, text, reference');

      await page.click('button[type="submit"]:has-text("Save")');

      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 20000 });
      await expect(toast).toContainText('Content saved');
    });
  });

  test.describe('Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should show error for empty title', async ({ page }) => {
      // Try to submit without title
      await page.click('button[type="submit"]:has-text("Save")');

      // HTML5 validation should prevent submission
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toHaveAttribute('required');
    });

    test('should show error for invalid URL', async ({ page }) => {
      await page.selectOption('select[name="type"]', 'link');
      await page.fill('input[name="title"]', 'Bad Link');
      await page.fill('input[name="url"]', 'not-a-valid-url');

      await page.click('button[type="submit"]:has-text("Save")');

      // Should show validation error
      await expect(page.locator('text=Invalid URL')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Cancel Action', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should navigate back to dashboard on cancel', async ({ page }) => {
      // Fill in some data
      await page.fill('input[name="title"]', 'Temporary Note');
      await page.fill('textarea[name="body"]', 'This will be cancelled');

      // Click cancel
      await page.click('a:has-text("Cancel")');

      // Should be back on dashboard
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Loading States', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should show loading state during submission', async ({ page }) => {
      await page.fill('input[name="title"]', 'Test Note');

      // Start submission
      await page.click('button[type="submit"]:has-text("Save")');

      // Check for disabled submit button (brief window)
      const disabledButton = page.locator('button[type="submit"]:disabled');
      // Use a short timeout — the loading state is brief but should exist
      await expect(disabledButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Multiple Submissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/capture');
    });

    test('should allow creating multiple notes in sequence', async ({ page }) => {
      // First note
      await page.fill('input[name="title"]', 'First Note');
      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification
      const toast = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast).toBeVisible({ timeout: 15000 });
      await expect(toast).toContainText('Content saved');
      await page.waitForURL('/dashboard/library');

      // Go back to capture page
      await page.goto('/dashboard/capture');

      // Second note
      await page.fill('input[name="title"]', 'Second Note');
      await page.click('button[type="submit"]:has-text("Save")');

      // Wait for toast notification again
      const toast2 = page.getByRole('region', { name: 'Notifications' }).locator('[role="alert"]');
      await expect(toast2).toBeVisible({ timeout: 15000 });
      await expect(toast2).toContainText('Content saved');
    });
  });
});
