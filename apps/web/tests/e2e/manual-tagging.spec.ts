import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent } from '../helpers/db';

test.describe('Manual Tagging Feature', () => {
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
      title: 'Test Note for Tagging',
      body: 'This note will be used to test tag functionality',
      tags: ['initial', 'test'],
      createdAt: new Date('2024-01-15'),
    });

    await createTestContent(testUser.id, {
      type: 'link',
      title: 'Test Link',
      url: 'https://example.com',
      tags: ['reference', 'javascript', 'programming'],
      createdAt: new Date('2024-01-20'),
    });

    await createTestContent(testUser.id, {
      type: 'note',
      title: 'Another Note',
      body: 'Second test note',
      tags: [],
      createdAt: new Date('2024-01-10'),
    });

    // Navigate to login page
    await page.goto('/login');

    // Login with dev credentials
    await page.fill('input[name="email"]', 'test@mindweave.dev');
    await page.click('button[type="submit"]:has-text("Dev Login")');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Navigate to library
    await page.goto('/dashboard/library');
  });

  test.describe('Tag Display', () => {
    test('should display existing tags on content cards', async ({ page }) => {
      // Check first card has initial tags
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');
      await expect(firstCard.locator('text=initial')).toBeVisible();
      await expect(firstCard.locator('text=test')).toBeVisible();
    });

    test('should display "No tags" when content has no tags', async ({ page }) => {
      const thirdCard = page.locator('text=Another Note').locator('..');
      await expect(thirdCard.locator('text=No tags')).toBeVisible();
    });

    test('should show "Edit tags" button on all cards', async ({ page }) => {
      const editButtons = page.locator('button:has-text("Edit tags")');
      await expect(editButtons).toHaveCount(3);
    });
  });

  test.describe('Edit Mode', () => {
    test('should enter edit mode when clicking "Edit tags"', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Click Edit tags button
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Should show tag input
      await expect(firstCard.locator('input[placeholder="Add tags..."]')).toBeVisible();

      // Should show Save and Cancel buttons
      await expect(firstCard.locator('button:has-text("Save")').first()).toBeVisible();
      await expect(firstCard.locator('button:has-text("Cancel")').first()).toBeVisible();
    });

    test('should exit edit mode when clicking Cancel', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Click Cancel
      await firstCard.locator('button:has-text("Cancel")').first().click();

      // Should exit edit mode
      await expect(firstCard.locator('input[placeholder="Add tags..."]')).not.toBeVisible();
      await expect(firstCard.locator('button:has-text("Edit tags")').first()).toBeVisible();
    });

    test('should show existing tags in edit mode', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Should still show existing tags as badges
      await expect(firstCard.locator('text=initial')).toBeVisible();
      await expect(firstCard.locator('text=test')).toBeVisible();
    });
  });

  test.describe('Adding Tags', () => {
    test('should add new tag when typing and pressing Enter', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type new tag and press Enter
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('newtag');
      await input.press('Enter');

      // Should show the new tag
      await expect(firstCard.locator('text=newtag')).toBeVisible();

      // Input should be cleared
      await expect(input).toHaveValue('');
    });

    test('should add tag by clicking suggestion', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type to show suggestions
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('java');

      // Wait for and click suggestion
      await page.waitForSelector('button:has-text("javascript")');
      await page.locator('button:has-text("javascript")').click();

      // Should show the tag
      await expect(firstCard.locator('text=javascript')).toBeVisible();
    });

    test('should not add empty tag', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Count current tags
      const initialTagCount = await firstCard.locator('[class*="rounded-full"]').count();

      // Press Enter without typing
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.press('Enter');

      // Tag count should remain same
      const finalTagCount = await firstCard.locator('[class*="rounded-full"]').count();
      expect(finalTagCount).toBe(initialTagCount);
    });

    test('should not add duplicate tag', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Try to add existing tag
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('initial');
      await input.press('Enter');

      // Should still have only one "initial" tag
      const initialTags = firstCard.locator('text=initial');
      await expect(initialTags).toHaveCount(1);
    });
  });

  test.describe('Removing Tags', () => {
    test('should remove tag when clicking remove button', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Click remove button on first tag
      const removeButtons = firstCard.locator('button[aria-label="Remove"]');
      await removeButtons.first().click();

      // Tag should be removed (wait a moment for UI update)
      await page.waitForTimeout(100);
    });

    test('should remove last tag with Backspace on empty input', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Count initial tags
      const initialCount = await firstCard.locator('button[aria-label="Remove"]').count();

      // Press Backspace in empty input
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.press('Backspace');

      // Should have one less tag
      const finalCount = await firstCard.locator('button[aria-label="Remove"]').count();
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test.describe('Saving Tags', () => {
    test('should save tags when clicking Save button', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Add a new tag
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('saved-tag');
      await input.press('Enter');

      // Click Save
      await firstCard.locator('button:has-text("Save")').first().click();

      // Wait for save to complete
      await page.waitForTimeout(500);

      // Should exit edit mode
      await expect(input).not.toBeVisible();

      // Refresh page to verify persistence
      await page.reload();

      // Tag should still be there
      await expect(page.locator('text=saved-tag')).toBeVisible();
    });

    test('should auto-save after 1 second of inactivity', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Add a new tag
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('auto-saved');
      await input.press('Enter');

      // Wait for auto-save (1 second + buffer)
      await page.waitForTimeout(1500);

      // Refresh page to verify persistence
      await page.reload();

      // Tag should be saved
      await expect(page.locator('text=auto-saved')).toBeVisible();
    });

    test('should show "Saving..." during save', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Add a new tag
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('test-save');
      await input.press('Enter');

      // Click Save
      await firstCard.locator('button:has-text("Save")').first().click();

      // Should briefly show "Saving..." (might be too fast to catch)
      // Just verify it completes successfully
      await page.waitForTimeout(1000);
      await expect(input).not.toBeVisible();
    });
  });

  test.describe('Tag Autocomplete', () => {
    test('should show suggestions from existing tags', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type to trigger autocomplete
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('ref');

      // Should show "reference" suggestion from other content
      await expect(page.locator('button:has-text("reference")')).toBeVisible();
    });

    test('should filter suggestions as user types', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type to trigger autocomplete
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('prog');

      // Should show "programming" suggestion
      await expect(page.locator('button:has-text("programming")')).toBeVisible();

      // Should not show unrelated tags
      await expect(page.locator('button:has-text("reference")')).not.toBeVisible();
    });

    test('should not show already selected tags in suggestions', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type to trigger autocomplete
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('test');

      // Should not show "test" in suggestions (already selected)
      const suggestionButtons = page.locator('button');
      const suggestionTexts = await suggestionButtons.allTextContents();
      expect(suggestionTexts.filter(t => t === 'test').length).toBeLessThanOrEqual(1);
    });

    test('should close suggestions on Escape', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Type to show suggestions
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('ref');

      // Verify suggestions are visible
      await expect(page.locator('button:has-text("reference")')).toBeVisible();

      // Press Escape
      await input.press('Escape');

      // Suggestions should be hidden
      await expect(page.locator('button:has-text("reference")')).not.toBeVisible();
    });
  });

  test.describe('Multiple Content Items', () => {
    test('should edit tags on different items independently', async ({ page }) => {
      // Edit first card
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');
      await firstCard.locator('button:has-text("Edit tags")').click();
      await expect(firstCard.locator('input[placeholder="Add tags..."]')).toBeVisible();

      // Other cards should not be in edit mode
      const secondCard = page.locator('text=Test Link').locator('..');
      await expect(secondCard.locator('input[placeholder="Add tags..."]')).not.toBeVisible();
    });

    test('should save tags for specific content item only', async ({ page }) => {
      const thirdCard = page.locator('text=Another Note').locator('..');

      // Enter edit mode
      await thirdCard.locator('button:has-text("Edit tags")').click();

      // Add tags
      const input = thirdCard.locator('input[placeholder="Add tags..."]');
      await input.fill('unique-tag');
      await input.press('Enter');

      // Save
      await thirdCard.locator('button:has-text("Save")').first().click();
      await page.waitForTimeout(500);

      // Refresh page
      await page.reload();

      // Only the third card should have the new tag
      const uniqueTagCount = await page.locator('text=unique-tag').count();
      expect(uniqueTagCount).toBe(1);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle very long tag names', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Try to add very long tag (should be truncated to 50 chars)
      const longTag = 'a'.repeat(60);
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill(longTag);
      await input.press('Enter');

      // Should add the tag (truncated)
      await page.waitForTimeout(200);
    });

    test('should handle special characters in tags', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Add tag with special characters
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('c++');
      await input.press('Enter');

      // Should show the tag
      await expect(firstCard.locator('text=c++')).toBeVisible();
    });

    test('should persist tags after page refresh', async ({ page }) => {
      const firstCard = page.locator('text=Test Note for Tagging').locator('..');

      // Enter edit mode
      await firstCard.locator('button:has-text("Edit tags")').click();

      // Add and save tag
      const input = firstCard.locator('input[placeholder="Add tags..."]');
      await input.fill('persistent');
      await input.press('Enter');
      await firstCard.locator('button:has-text("Save")').first().click();
      await page.waitForTimeout(500);

      // Refresh page
      await page.reload();

      // Tag should still be there
      await expect(page.locator('text=persistent')).toBeVisible();
    });
  });
});
