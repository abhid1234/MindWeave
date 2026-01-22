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
      // Should show type badges
      const noteBadges = page.locator('text=note');
      const linkBadges = page.locator('text=link');
      const fileBadges = page.locator('text=file');

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
      // Click on Notes filter
      await page.click('a:has-text("Notes")');

      // Should update URL
      await expect(page).toHaveURL('/dashboard/library?type=note&sortBy=createdAt&sortOrder=desc');

      // Should show only notes
      await expect(page.locator('text=Showing 2 items')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Useful Link' })).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).not.toBeVisible();
    });

    test('should filter by link type', async ({ page }) => {
      // Click on Links filter
      await page.click('a:has-text("Links")');

      await expect(page).toHaveURL('/dashboard/library?type=link&sortBy=createdAt&sortOrder=desc');

      // Should show only links
      await expect(page.locator('text=Showing 1 item')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Useful Link' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).not.toBeVisible();
    });

    test('should filter by file type', async ({ page }) => {
      // Click on Files filter
      await page.click('a:has-text("Files")');

      await expect(page).toHaveURL('/dashboard/library?type=file&sortBy=createdAt&sortOrder=desc');

      // Should show only files
      await expect(page.locator('text=Showing 1 item')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).toBeVisible();
    });

    test('should show all content when clicking All filter', async ({ page }) => {
      // First filter by notes
      await page.click('a:has-text("Notes")');
      await expect(page.locator('text=Showing 2 items')).toBeVisible();

      // Then click All
      await page.click('a:has-text("All")');
      await expect(page).toHaveURL(/^\/dashboard\/library($|\?(?!type))/);

      // Should show all 4 items again
      await expect(page.locator('text=Showing 4 items')).toBeVisible();
    });

    test('should highlight active type filter', async ({ page }) => {
      // Notes button should be highlighted when filtered
      await page.click('a:has-text("Notes")');

      const notesButton = page.locator('a:has-text("Notes")');
      const className = await notesButton.getAttribute('class');
      expect(className).toContain('bg-primary');
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
      // Click Oldest First
      await page.click('a:has-text("Oldest First")');

      await expect(page).toHaveURL('/dashboard/library?sortBy=createdAt&sortOrder=asc');

      const cards = page.locator('.grid > div');

      // First should be "Useful Link" (2024-01-10)
      await expect(cards.nth(0).getByRole('heading', { name: 'Useful Link' })).toBeVisible();

      // Last should be "Important File" (2024-01-25)
      await expect(cards.nth(3).getByRole('heading', { name: 'Important File' })).toBeVisible();
    });

    test('should sort by title A-Z', async ({ page }) => {
      // Click Title A-Z
      await page.click('a:has-text("Title A-Z")');

      await expect(page).toHaveURL('/dashboard/library?sortBy=title&sortOrder=asc');

      const cards = page.locator('.grid > div');

      // Should be alphabetically sorted
      await expect(cards.nth(0).getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(cards.nth(2).getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(cards.nth(3).getByRole('heading', { name: 'Useful Link' })).toBeVisible();
    });

    test('should sort by title Z-A', async ({ page }) => {
      // Click Title Z-A
      await page.click('a:has-text("Title Z-A")');

      await expect(page).toHaveURL('/dashboard/library?sortBy=title&sortOrder=desc');

      const cards = page.locator('.grid > div');

      // Should be reverse alphabetically sorted
      await expect(cards.nth(0).getByRole('heading', { name: 'Useful Link' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(cards.nth(2).getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(cards.nth(3).getByRole('heading', { name: 'First Note' })).toBeVisible();
    });

    test('should highlight active sort option', async ({ page }) => {
      await page.click('a:has-text("Title A-Z")');

      const sortButton = page.locator('a:has-text("Title A-Z")');
      const className = await sortButton.getAttribute('class');
      expect(className).toContain('bg-primary');
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
      // Click on "important" tag
      await page.locator('a:has-text("important")').first().click();

      await expect(page).toHaveURL('/dashboard/library?tag=important&sortBy=createdAt&sortOrder=desc');

      // Should show only items with "important" tag
      await expect(page.locator('text=Showing 2 items')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Important File' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).not.toBeVisible();
    });

    test('should show clear tag filter button when tag is selected', async ({ page }) => {
      // Filter by tag
      await page.locator('a:has-text("work")').first().click();

      // Clear button should appear
      await expect(page.locator('text=Clear tag filter')).toBeVisible();
    });

    test('should clear tag filter when clicking clear button', async ({ page }) => {
      // Filter by tag
      await page.locator('a:has-text("work")').first().click();
      await expect(page.locator('text=Showing 2 items')).toBeVisible();

      // Click clear button
      await page.click('text=Clear tag filter');

      // Should show all items again
      await expect(page.locator('text=Showing 4 items')).toBeVisible();
    });

    test('should highlight selected tag', async ({ page }) => {
      await page.locator('a:has-text("personal")').first().click();

      const tagButton = page.locator('a:has-text("personal")').first();
      const className = await tagButton.getAttribute('class');
      expect(className).toContain('bg-primary');
    });
  });

  test.describe('Combined Filters', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/library');
    });

    test('should combine type and tag filters', async ({ page }) => {
      // Filter by note type
      await page.click('a:has-text("Notes")');

      // Then filter by "work" tag
      await page.locator('a:has-text("work")').first().click();

      await expect(page).toHaveURL('/dashboard/library?type=note&tag=work&sortBy=createdAt&sortOrder=desc');

      // Should show only the "Second Note" which is type=note AND has "work" tag
      await expect(page.locator('text=Showing 1 item')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Second Note' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'First Note' })).not.toBeVisible();
    });

    test('should combine type filter with sorting', async ({ page }) => {
      // Filter by notes
      await page.click('a:has-text("Notes")');

      // Sort by title A-Z
      await page.click('a:has-text("Title A-Z")');

      await expect(page).toHaveURL('/dashboard/library?type=note&sortBy=title&sortOrder=asc');

      const cards = page.locator('.grid > div');

      // Should show 2 notes in alphabetical order
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0).getByRole('heading', { name: 'First Note' })).toBeVisible();
      await expect(cards.nth(1).getByRole('heading', { name: 'Second Note' })).toBeVisible();
    });

    test('should preserve filters when changing sort order', async ({ page }) => {
      // Apply type and tag filters
      await page.click('a:has-text("Notes")');
      await page.locator('a:has-text("important")').first().click();

      // Change sort order
      await page.click('a:has-text("Oldest First")');

      // Should preserve filters
      const url = await page.url();
      expect(url).toContain('type=note');
      expect(url).toContain('tag=important');
      expect(url).toContain('sortBy=createdAt');
      expect(url).toContain('sortOrder=asc');
    });
  });

  test.describe('Empty States', () => {
    test('should show empty state when no content matches filters', async ({ page }) => {
      await page.goto('/dashboard/library');

      // Create a filter combination that has no results
      // Filter by files
      await page.click('a:has-text("Files")');

      // Then try to filter by "work" tag (files don't have this tag)
      await page.locator('a:has-text("work")').first().click();

      // Should show empty state
      await expect(page.locator('text=No content matches your filters')).toBeVisible();
    });

    test('should show create content link in empty state', async ({ page }) => {
      await page.goto('/dashboard/library');

      // Apply filters that return no results
      await page.click('a:has-text("Files")');
      await page.locator('a:has-text("personal")').first().click();

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
      // Apply filters with no results
      await page.click('a:has-text("Files")');
      await page.locator('a:has-text("personal")').first().click();

      // Click create content link
      await page.click('a:has-text("Create Content")');

      // Should navigate to capture page
      await expect(page).toHaveURL('/dashboard/capture');
    });

    test('should open external links in new tab', async ({ page }) => {
      // Check that the external link has correct attributes
      const externalLink = page.locator('a[href="https://example.com"]');
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
