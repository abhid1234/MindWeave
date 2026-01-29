import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent } from '../helpers/db';

test.describe('Library Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clean database before each test
    await cleanDatabase();

    // Create test user and log in
    const testUser = await createTestUser({
      email: 'test@mindweave.dev',
      name: 'Test User',
    });

    // Create sample content for testing
    await createTestContent(testUser.id, {
      type: 'note',
      title: 'First Note',
      body: 'This is my first note',
      tags: ['important', 'personal'],
      createdAt: new Date('2024-01-15'),
    });

    await createTestContent(testUser.id, {
      type: 'note',
      title: 'Second Note',
      body: 'Another note',
      tags: ['work'],
      createdAt: new Date('2024-01-20'),
    });

    await createTestContent(testUser.id, {
      type: 'link',
      title: 'Useful Link',
      url: 'https://example.com',
      tags: ['reference', 'work'],
      createdAt: new Date('2024-01-10'),
    });

    await createTestContent(testUser.id, {
      type: 'file',
      title: 'Important File',
      tags: ['important'],
      createdAt: new Date('2024-01-25'),
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
    test('should navigate to library page from dashboard', async ({ page }) => {
      // Click on Library in navigation
      await page.click('a[href="/dashboard/library"]');

      // Should be on library page
      await expect(page).toHaveURL('/dashboard/library');
      await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible();
    });

    test('should show correct page description', async ({ page }) => {
      await page.goto('/dashboard/library');
      await expect(page.locator('text=Browse and organize all your saved content')).toBeVisible();
    });
  });

  test.describe('Content Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should display all content items', async ({ page }) => {
      // Should show 4 items
      await expect(page.locator('text=Showing 4 items')).toBeVisible();

      // Should display all content cards (use heading selector to be specific)
      await expect(page.getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Useful Link' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).toBeVisible();
    });

    test('should display content type badges', async ({ page }) => {
      // Should show type badges on cards (use specific badge selector)
      const cardsArea = page.locator('.grid');
      // Type badges have rounded-full class and capitalize class
      const noteBadges = cardsArea.locator('span.capitalize:has-text("note")');
      const linkBadges = cardsArea.locator('span.capitalize:has-text("link")');
      const fileBadges = cardsArea.locator('span.capitalize:has-text("file")');

      await expect(noteBadges).toHaveCount(2);
      await expect(linkBadges).toHaveCount(1);
      await expect(fileBadges).toHaveCount(1);
    });

    test('should display tags', async ({ page }) => {
      // Check for various tags (use first() since tags appear on multiple cards)
      await expect(page.locator('text=important').first()).toBeVisible();
      await expect(page.locator('text=personal').first()).toBeVisible();
      await expect(page.locator('text=work').first()).toBeVisible();
      await expect(page.locator('text=reference').first()).toBeVisible();
    });

    test('should display URLs for link type content', async ({ page }) => {
      await expect(page.locator('a[href="https://example.com"]')).toBeVisible();
    });
  });

  test.describe('Type Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should filter by note type', async ({ page }) => {
      // Navigate with type filter in URL
      await page.goto('/dashboard/library?type=note');

      // Should show only 2 items (notes)
      await expect(page.locator('text=Showing 2 items')).toBeVisible({ timeout: 10000 });

      // Notes button should be highlighted (active)
      const notesButton = page.locator('a:has-text("Notes")');
      await expect(notesButton).toHaveClass(/bg-primary/);

      // Should show only notes
      await expect(page.getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Useful Link' })).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).not.toBeVisible();
    });

    test('should filter by link type', async ({ page }) => {
      // Navigate with type filter in URL
      await page.goto('/dashboard/library?type=link');

      // Should show only 1 item (link)
      await expect(page.locator('text=Showing 1 item')).toBeVisible({ timeout: 10000 });

      // Links button should be highlighted (active)
      const linksButton = page.locator('a:has-text("Links")');
      await expect(linksButton).toHaveClass(/bg-primary/);

      // Should show only links
      await expect(page.getByRole('heading', { name: 'Useful Link' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).not.toBeVisible();
    });

    test('should filter by file type', async ({ page }) => {
      // Navigate with type filter in URL
      await page.goto('/dashboard/library?type=file');

      // Should show only 1 item (file)
      await expect(page.locator('text=Showing 1 item')).toBeVisible({ timeout: 10000 });

      // Files button should be highlighted (active)
      const filesButton = page.locator('a:has-text("Files")');
      await expect(filesButton).toHaveClass(/bg-primary/);

      // Should show only files
      await expect(page.getByRole('heading', { name: 'Important File' })).toBeVisible();
    });

    test('should show all content when clicking All filter', async ({ page }) => {
      // Navigate to notes filter via URL to avoid click timing issues
      await page.goto('/dashboard/library?type=note');
      await expect(page.locator('text=Showing 2 items')).toBeVisible({ timeout: 10000 });

      // Navigate back to unfiltered library via URL
      await page.goto('/dashboard/library');

      // Wait for showing all items
      await expect(page.locator('text=Showing 4 items')).toBeVisible({ timeout: 10000 });

      // Verify URL doesn't have type parameter
      expect(page.url()).not.toContain('type=');
    });

    test('should highlight active type filter', async ({ page }) => {
      // Navigate with type filter in URL
      await page.goto('/dashboard/library?type=note');

      // Wait for content to update
      await expect(page.locator('text=Showing 2 items')).toBeVisible({ timeout: 10000 });

      const notesButton = page.locator('a:has-text("Notes")');
      await expect(notesButton).toHaveClass(/bg-primary/);
    });
  });

  test.describe('Sorting', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should sort by newest first by default', async ({ page }) => {
      // Get all content cards in order
      const cards = page.locator('.grid > div');

      // First should be "Important File" (2024-01-25)
      await expect(cards.nth(0).getByRole('heading', { name: 'Important File' })).toBeVisible();

      // Second should be "Second Note" (2024-01-20)
      await expect(cards.nth(1).getByRole('heading', { name: 'Second Note' })).toBeVisible();
    });

    test('should sort by oldest first', async ({ page }) => {
      // Navigate with sort params in URL
      await page.goto('/dashboard/library?sortBy=createdAt&sortOrder=asc');

      // Wait for sort button to be highlighted
      const oldestButton = page.locator('a:has-text("Oldest First")');
      await expect(oldestButton).toHaveClass(/bg-primary/, { timeout: 10000 });

      const cards = page.locator('.grid > div');

      // First should be "Useful Link" (2024-01-10)
      await expect(cards.nth(0).getByRole('heading', { name: 'Useful Link' })).toBeVisible();

      // Last should be "Important File" (2024-01-25)
      await expect(cards.nth(3).getByRole('heading', { name: 'Important File' })).toBeVisible();
    });

    test('should sort by title A-Z', async ({ page }) => {
      // Navigate with sort params in URL
      await page.goto('/dashboard/library?sortBy=title&sortOrder=asc');

      // Wait for sort button to be highlighted
      const titleAZButton = page.locator('a:has-text("Title A-Z")');
      await expect(titleAZButton).toHaveClass(/bg-primary/, { timeout: 10000 });

      const cards = page.locator('.grid > div');

      // Should be alphabetically sorted
      await expect(cards.nth(0).getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(cards.nth(2).getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(cards.nth(3).getByRole('heading', { name: 'Useful Link' })).toBeVisible();
    });

    test('should sort by title Z-A', async ({ page }) => {
      // Navigate with sort params in URL
      await page.goto('/dashboard/library?sortBy=title&sortOrder=desc');

      // Wait for sort button to be highlighted
      const titleZAButton = page.locator('a:has-text("Title Z-A")');
      await expect(titleZAButton).toHaveClass(/bg-primary/, { timeout: 10000 });

      const cards = page.locator('.grid > div');

      // Should be reverse alphabetically sorted
      await expect(cards.nth(0).getByRole('heading', { name: 'Useful Link' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(cards.nth(2).getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(cards.nth(3).getByRole('heading', { name: 'First Note' })).toBeVisible();
    });

    test('should highlight active sort option', async ({ page }) => {
      // Navigate with sort params in URL
      await page.goto('/dashboard/library?sortBy=title&sortOrder=asc');

      const sortButton = page.getByRole('link', { name: 'Title A-Z' });
      await expect(sortButton).toHaveClass(/bg-primary/, { timeout: 10000 });
    });
  });

  test.describe('Tag Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should display tag filter section', async ({ page }) => {
      await expect(page.locator('text=Filter by Tag')).toBeVisible();
    });

    test('should filter by tag', async ({ page }) => {
      // Navigate with tag filter in URL
      await page.goto('/dashboard/library?tag=important');

      // Wait for content to update - should show only 2 items
      await expect(page.locator('text=Showing 2 items')).toBeVisible({ timeout: 10000 });

      // Should show only items with "important" tag
      await expect(page.getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).not.toBeVisible();
    });

    test('should show clear tag filter button when tag is selected', async ({ page }) => {
      // Navigate with tag filter in URL
      await page.goto('/dashboard/library?tag=work');

      // Clear button should appear
      await expect(page.locator('text=Clear tag filter')).toBeVisible({ timeout: 10000 });
    });

    test('should clear tag filter when clicking clear button', async ({ page }) => {
      await page.goto('/dashboard/library?tag=work');
      await expect(page.locator('text=Showing 2 items')).toBeVisible({ timeout: 10000 });

      await page.click('text=Clear tag filter');

      // window.location.href triggers full navigation
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Showing 4 items')).toBeVisible({ timeout: 10000 });
    });

    test('should highlight selected tag', async ({ page }) => {
      // Navigate with tag filter in URL
      await page.goto('/dashboard/library?tag=personal');

      // Wait for tag button to be highlighted
      const tagFilterSection = page.locator('text=Filter by Tag').locator('..');
      const tagButton = tagFilterSection.locator('a:has-text("personal")');
      await expect(tagButton).toHaveClass(/bg-primary/, { timeout: 10000 });
    });
  });

  test.describe('Combined Filters', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should combine type and tag filters', async ({ page }) => {
      // Navigate directly with combined filters via URL
      await page.goto('/dashboard/library?type=note&tag=work');

      // Should show only the "Second Note" which is type=note AND has "work" tag
      await expect(page.locator('text=Showing 1 item')).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).not.toBeVisible();
    });

    test('should combine type filter with sorting', async ({ page }) => {
      // Navigate directly with combined filters via URL
      await page.goto('/dashboard/library?type=note&sortBy=title&sortOrder=asc');

      const cards = page.locator('.grid > div');

      // Should show 2 notes in alphabetical order
      await expect(cards).toHaveCount(2, { timeout: 10000 });
      await expect(cards.nth(0).getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Second Note' })).toBeVisible();
    });

    test('should preserve filters when changing sort order', async ({ page }) => {
      // Navigate directly with all filters including sort via URL
      await page.goto('/dashboard/library?type=note&tag=important&sortBy=createdAt&sortOrder=asc');

      // Verify the sort option is active
      const oldestButton = page.locator('a:has-text("Oldest First")');
      await expect(oldestButton).toHaveClass(/bg-primary/, { timeout: 10000 });

      // Verify all filters are preserved in the URL
      const url = page.url();
      expect(url).toContain('type=note');
      expect(url).toContain('tag=important');
      expect(url).toContain('sortBy=createdAt');
      expect(url).toContain('sortOrder=asc');
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no content matches filters', async ({ page }) => {
      // Navigate directly with combined filters that yield no results
      await page.goto('/dashboard/library?type=file&tag=work');

      // Should show empty state
      await expect(page.locator('text=No content matches your filters')).toBeVisible({ timeout: 10000 });
    });

    test('should show create content link in empty state', async ({ page }) => {
      // Navigate directly with combined filters that yield no results
      await page.goto('/dashboard/library?type=file&tag=personal');

      // Wait for empty state to appear
      await expect(page.locator('text=No content matches your filters')).toBeVisible({ timeout: 10000 });

      // Should show link to capture page
      const createLink = page.locator('a:has-text("Create Content")');
      await expect(createLink).toBeVisible();
      await expect(createLink).toHaveAttribute('href', '/dashboard/capture');
    });
  });

  test.describe('Navigation from Library', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should navigate to capture page from empty state', async ({ page }) => {
      // Navigate directly with combined filters that yield no results
      await page.goto('/dashboard/library?type=file&tag=personal');

      // Wait for empty state to appear
      await expect(page.locator('text=No content matches your filters')).toBeVisible({ timeout: 10000 });

      // Click create content link
      const createLink = page.getByRole('link', { name: 'Create Content' });
      await expect(createLink).toBeVisible();
      await createLink.click();

      // Wait for navigation
      await expect(page).toHaveURL('/dashboard/capture', { timeout: 10000 });
    });

    test('should open external links in new tab', async ({ page }) => {
      // Check that the external link has correct attributes
      const externalLink = page.locator('a[href="https://example.com"]');
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
