import { test, expect, Page } from '@playwright/test';
import { cleanDatabase, createTestUser } from '../helpers/db';
import path from 'path';

/** Mock parse result returned by intercepted /api/import */
const MOCK_PARSE_RESULT = {
  success: true,
  items: [
    { title: 'Example Article One', url: 'https://example.com/article1', type: 'link', tags: [] },
    { title: 'Example Article Two', url: 'https://example.com/article2', type: 'link', tags: [] },
    { title: 'Example Article Three', url: 'https://example.com/article3', type: 'link', tags: ['tech'] },
  ],
  errors: [],
  warnings: [],
  stats: { total: 3, parsed: 3, skipped: 0 },
};

/** Intercept /api/import POST to return mock parse result (avoids rate limiting) */
async function mockParseAPI(page: Page, response: Record<string, unknown> = MOCK_PARSE_RESULT, status = 200) {
  await page.route('**/api/import', (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/** Navigate to upload step with bookmarks source selected */
async function goToUploadStep(page: Page) {
  await page.goto('/dashboard/import');
  await page.getByText('Browser Bookmarks').click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

/** Upload the bookmarks fixture file */
async function uploadBookmarksFile(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  const fixturesPath = path.resolve(__dirname, '../fixtures/bookmarks.html');
  await fileInput.setInputFiles(fixturesPath);
}

/** Navigate through to preview step with mocked API */
async function goToPreviewStep(page: Page) {
  await mockParseAPI(page);
  await goToUploadStep(page);
  await uploadBookmarksFile(page);
  await page.getByRole('button', { name: 'Parse File' }).click();
  await expect(page.getByText('items parsed')).toBeVisible({ timeout: 15000 });
}

test.describe('Import Feature', () => {
  test.beforeEach(async ({ page }) => {
    await cleanDatabase();
    await createTestUser({
      email: 'test@mindweave.dev',
      name: 'Test User',
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@mindweave.dev');
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
  });

  test.describe('Navigation & Page Load', () => {
    test('should navigate to import page from dashboard sidebar', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.click('a[href="/dashboard/import"]');
      await expect(page).toHaveURL('/dashboard/import', { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Import Content', level: 1 })).toBeVisible();
    });

    test('should show heading and source selector grid', async ({ page }) => {
      await page.goto('/dashboard/import');
      await expect(page.getByRole('heading', { name: 'Import Content' })).toBeVisible();
      await expect(page.getByText('Browser Bookmarks')).toBeVisible();
    });
  });

  test.describe('Source Selection', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/import');
    });

    test('should display all 5 import sources', async ({ page }) => {
      await expect(page.getByText('Browser Bookmarks')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pocket' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Notion' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Evernote' })).toBeVisible();
      await expect(page.getByText('X (Twitter) Bookmarks')).toBeVisible();
    });

    test('should have Continue button disabled until source is selected', async ({ page }) => {
      const continueButton = page.getByRole('button', { name: 'Continue' });
      await expect(continueButton).toBeDisabled();
    });

    test('should enable Continue after selecting a source', async ({ page }) => {
      await page.getByText('Browser Bookmarks').click();
      const continueButton = page.getByRole('button', { name: 'Continue' });
      await expect(continueButton).toBeEnabled();
    });
  });

  test.describe('File Upload Step', () => {
    test.beforeEach(async ({ page }) => {
      await goToUploadStep(page);
    });

    test('should show upload zone with accepted file types', async ({ page }) => {
      await expect(page.getByText('Drag and drop or click to upload')).toBeVisible();
      await expect(page.getByText('Accepted formats:')).toBeVisible();
      await expect(page.getByText('.html')).toBeVisible();
    });

    test('should return to source selection when clicking Back', async ({ page }) => {
      await page.getByRole('button', { name: 'Back' }).click();
      await expect(page.getByText('Browser Bookmarks')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    });

    test('should show file name and size after selecting a valid file', async ({ page }) => {
      await uploadBookmarksFile(page);
      await expect(page.getByText('bookmarks.html')).toBeVisible();
    });

    test('should have Parse File button disabled without a file', async ({ page }) => {
      const parseButton = page.getByRole('button', { name: 'Parse File' });
      await expect(parseButton).toBeDisabled();
    });
  });

  test.describe('Parse & Preview', () => {
    test.beforeEach(async ({ page }) => {
      await mockParseAPI(page);
      await goToUploadStep(page);
      await uploadBookmarksFile(page);
    });

    test('should show loading state or transition to preview when parsing', async ({ page }) => {
      // With mocked API, the response is instant so we may skip the loading state.
      // Verify that clicking Parse File transitions away from upload step.
      await page.getByRole('button', { name: 'Parse File' }).click();
      // Either "Parsing..." briefly appears or we go straight to preview
      await expect(page.getByText('items parsed')).toBeVisible({ timeout: 15000 });
    });

    test('should show item count and select-all after parsing', async ({ page }) => {
      await page.getByRole('button', { name: 'Parse File' }).click();
      await expect(page.getByText('items parsed')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Select all/)).toBeVisible();
    });

    test('should allow toggling individual items', async ({ page }) => {
      await page.getByRole('button', { name: 'Parse File' }).click();
      await expect(page.getByText('items parsed')).toBeVisible({ timeout: 15000 });

      // Click first item to deselect
      await page.getByText('Example Article One').click();

      // Selected count should show 2
      await expect(page.getByText('2 selected for import')).toBeVisible();
    });

    test('should disable Import button when no items selected', async ({ page }) => {
      await page.getByRole('button', { name: 'Parse File' }).click();
      await expect(page.getByText('items parsed')).toBeVisible({ timeout: 15000 });

      // Deselect all
      await page.getByText(/Select all/).click();

      // Import button with 0 items should be disabled
      const importButton = page.getByRole('button', { name: /Import 0/ });
      await expect(importButton).toBeDisabled();
    });
  });

  test.describe('Import & Completion', () => {
    test.beforeEach(async ({ page }) => {
      await goToPreviewStep(page);
    });

    test('should show progress state during import', async ({ page }) => {
      await page.getByRole('button', { name: /Import \d+ Item/ }).click();
      await expect(page.getByText(/Importing \d+ items/)).toBeVisible({ timeout: 5000 });
    });

    test('should show success screen with imported count', async ({ page }) => {
      await page.getByRole('button', { name: /Import \d+ Item/ }).click();
      await expect(page.getByText('Import Complete')).toBeVisible({ timeout: 30000 });
      await expect(page.getByText('Imported', { exact: true })).toBeVisible({ timeout: 5000 });
    });

    test('should have View in Library link that navigates to library', async ({ page }) => {
      await page.getByRole('button', { name: /Import \d+ Item/ }).click();
      await expect(page.getByText('Import Complete')).toBeVisible({ timeout: 30000 });

      await page.getByRole('link', { name: 'View in Library' }).click();
      await expect(page).toHaveURL('/dashboard/library', { timeout: 10000 });
    });

    test('should reset wizard when clicking Import More', async ({ page }) => {
      await page.getByRole('button', { name: /Import \d+ Item/ }).click();
      await expect(page.getByText('Import Complete')).toBeVisible({ timeout: 30000 });

      await page.getByRole('button', { name: 'Import More' }).click();

      await expect(page.getByText('Browser Bookmarks')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for invalid/corrupt file', async ({ page }) => {
      // Mock API to return validation error
      await mockParseAPI(
        page,
        { success: false, message: 'This does not appear to be a valid bookmarks HTML file.' },
        400
      );

      await goToUploadStep(page);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'corrupt.html',
        mimeType: 'text/html',
        buffer: Buffer.from('this is not valid bookmarks html'),
      });

      await page.getByRole('button', { name: 'Parse File' }).click();

      await expect(page.getByText('does not appear to be a valid')).toBeVisible({ timeout: 15000 });
    });

    test('should handle parse failure gracefully', async ({ page }) => {
      // Mock API to return server error
      await mockParseAPI(
        page,
        { success: false, message: 'Failed to parse import file.' },
        500
      );

      await goToUploadStep(page);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'empty.html',
        mimeType: 'text/html',
        buffer: Buffer.from(''),
      });

      await page.getByRole('button', { name: 'Parse File' }).click();

      await expect(page.getByText('Failed to parse')).toBeVisible({ timeout: 15000 });
    });

    test('should redirect unauthenticated user to login', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/dashboard/import');

      await expect(page).toHaveURL(/\/login/);

      await context.close();
    });
  });
});
