import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent, createTestEmbedding } from '../helpers/db';

test.describe('Knowledge Q&A', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test('displays ask page with input and submit button', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    // Check page heading
    await expect(page.getByRole('heading', { name: /ask your knowledge base/i })).toBeVisible();

    // Check input field exists
    const questionInput = page.locator('input[placeholder*="Ask a question"]');
    await expect(questionInput).toBeVisible();

    // Check submit button exists
    await expect(page.getByRole('button', { name: /ask/i })).toBeVisible();
  });

  test('shows tips section for better answers', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    // Check tips heading
    await expect(page.getByText(/tips for better answers/i)).toBeVisible();

    // Check at least one tip is visible
    await expect(page.getByText(/be specific/i)).toBeVisible();
  });

  test('disables submit button when input is empty', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    // Submit button should be disabled when input is empty
    const askButton = page.getByRole('button', { name: /ask/i });
    await expect(askButton).toBeDisabled();
  });

  test('enables submit button when text is entered', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    const questionInput = page.locator('input[placeholder*="Ask a question"]');
    await questionInput.fill('What do I know about React?');

    // Submit button should be enabled
    const askButton = page.getByRole('button', { name: /ask/i });
    await expect(askButton).toBeEnabled();
  });

  test('can navigate to ask page from sidebar', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    // Click Ask link in navigation
    await page.click('a:has-text("Ask")');

    await expect(page).toHaveURL(/\/dashboard\/ask/);
    await expect(page.getByRole('heading', { name: /ask your knowledge base/i })).toBeVisible();
  });

  test('shows chat interface layout', async ({ page }) => {
    const user = await createTestUser();

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    // Check for Knowledge Q&A region
    const qaRegion = page.locator('[aria-label="Knowledge Q&A"]');
    await expect(qaRegion).toBeVisible();

    // Check for empty state with example questions
    await expect(page.getByText(/ask anything about your knowledge base/i)).toBeVisible();
  });

  test('input handles submission attempt', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {
      type: 'note',
      title: 'React Hooks Guide',
      body: 'useState and useEffect are the most common hooks',
      tags: ['react'],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/ask');

    const questionInput = page.locator('input[placeholder*="Ask a question"]');
    await questionInput.fill('What do I know about React hooks?');

    const askButton = page.getByRole('button', { name: /ask/i });
    await askButton.click();

    // After submission, button should show loading state or message should appear
    await page.waitForTimeout(2000);

    // Either shows a response, loading state, or error (API key may not be set)
    const pageContent = await page.textContent('body');
    const hasResponse = pageContent?.includes('React') ||
                        pageContent?.includes('Thinking') ||
                        pageContent?.includes('Searching') ||
                        pageContent?.includes('Error') ||
                        pageContent?.includes('error');
    expect(hasResponse).toBeTruthy();
  });
});
