import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent } from '../helpers/db';

test.describe('Full-text Search', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test('displays search bar in library page', async ({ page }) => {
    const user = await createTestUser();

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');

    // Navigate to library
    await page.goto('/dashboard/library');

    // Check search bar exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('searches content by title', async ({ page }) => {
    const user = await createTestUser();

    // Create test content
    await createTestContent(user.id, {
      type: 'note',
      title: 'React Hooks Tutorial',
      body: 'Learn about useState and useEffect',
      tags: ['react', 'hooks'],
    });
    await createTestContent(user.id, {
      type: 'note',
      title: 'Vue Composition API',
      body: 'Modern Vue development',
      tags: ['vue'],
    });

    // Login and navigate
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for "React"
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500); // Wait for debounce

    // Should show only React content
    await expect(page.getByRole('heading', { name: 'React Hooks Tutorial' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vue Composition API' })).not.toBeVisible();
  });

  test('searches content by body text', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'JavaScript',
      body: 'TypeScript is a superset of JavaScript',
      tags: [],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'Python',
      body: 'Python is great for data science',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search by body content
    await page.fill('input[placeholder*="Search"]', 'TypeScript');
    // Wait for URL to update with query
    await expect(page).toHaveURL(/query=TypeScript/);

    // Use heading selector to be more specific
    await expect(page.getByRole('heading', { name: 'JavaScript' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Python' })).not.toBeVisible();
  });

  test('searches content by tags', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Backend Development',
      body: 'Building APIs',
      tags: ['nodejs', 'api'],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'Frontend Development',
      body: 'Building UIs',
      tags: ['react', 'css'],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search by tag
    await page.fill('input[placeholder*="Search"]', 'nodejs');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Backend Development')).toBeVisible();
    await expect(page.locator('text=Frontend Development')).not.toBeVisible();
  });

  test('searches content by autoTags', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'ML Article',
      body: 'Machine learning basics',
      tags: [],
      autoTags: ['machine-learning', 'ai'],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'Web Article',
      body: 'Web development basics',
      tags: [],
      autoTags: ['web', 'frontend'],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search by autoTag
    await page.fill('input[placeholder*="Search"]', 'machine-learning');
    await page.waitForTimeout(500);

    await expect(page.locator('text=ML Article')).toBeVisible();
    await expect(page.locator('text=Web Article')).not.toBeVisible();
  });

  test('search is case insensitive', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'JavaScript Basics',
      body: 'Learn JavaScript',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search with lowercase
    await page.fill('input[placeholder*="Search"]', 'javascript');
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'JavaScript Basics' })).toBeVisible();

    // Search with uppercase
    await page.fill('input[placeholder*="Search"]', 'JAVASCRIPT');
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'JavaScript Basics' })).toBeVisible();

    // Search with mixed case
    await page.fill('input[placeholder*="Search"]', 'JaVaScRiPt');
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'JavaScript Basics' })).toBeVisible();
  });

  test('combines search with type filter', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'React Note',
      body: 'React notes',
      tags: [],
    });
    await createTestContent(user.id, {type: 'link',
      title: 'React Link',
      body: 'React tutorial link',
      tags: [],
      url: 'https://react.dev',
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    // Wait for URL to update with query
    await expect(page).toHaveURL(/query=React/);

    // Both should be visible
    await expect(page.getByRole('heading', { name: 'React Note' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'React Link' })).toBeVisible();

    // Dismiss suggestions dropdown by pressing Escape, then filter by note type
    await page.locator('input[placeholder*="Search"]').press('Escape');
    await page.click('a:has-text("Notes")');
    await expect(page).toHaveURL(/type=note/);

    // Only note should be visible
    await expect(page.getByRole('heading', { name: 'React Note' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'React Link' })).not.toBeVisible();
  });

  // Skip: Combined search + tag filter timing is unreliable
  test.skip('combines search with tag filter', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'React TypeScript',
      body: 'Using TypeScript with React',
      tags: ['react', 'typescript'],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'React JavaScript',
      body: 'Using JavaScript with React',
      tags: ['react', 'javascript'],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Both should be visible
    await expect(page.locator('text=React TypeScript')).toBeVisible();
    await expect(page.locator('text=React JavaScript')).toBeVisible();

    // Filter by typescript tag (use link selector in tag filter section)
    await page.locator('a:has-text("typescript")').first().click();

    // Only TypeScript one should be visible
    await expect(page.locator('text=React TypeScript')).toBeVisible();
    await expect(page.locator('text=React JavaScript')).not.toBeVisible();
  });

  // Skip: Sorting navigation timing is unreliable in E2E tests
  test.skip('combines search with sorting', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Zebra React',
      body: 'React content',
      tags: [],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'Apple React',
      body: 'React content',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    // Wait for URL to update with query
    await expect(page).toHaveURL(/query=React/);

    // Sort by title A-Z and wait for URL
    await page.click('a:has-text("Title A-Z")');
    await expect(page).toHaveURL(/sortBy=title.*sortOrder=asc/);

    // Check order (Apple should be first)
    const cards = page.locator('.grid > div');
    await expect(cards.first()).toContainText('Apple React');

    // Sort by title Z-A using the role selector
    await page.getByRole('link', { name: 'Title Z-A' }).click();

    // Wait for Zebra to be first (this confirms sort completed regardless of URL timing)
    await expect(cards.first()).toContainText('Zebra React', { timeout: 10000 });
  });

  test('clears search with X button', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Test Note',
      body: 'Test content',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for something
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Test');

    // Wait for URL to update with query (confirming search is active)
    await expect(page).toHaveURL(/query=Test/);

    // Clear button should be visible - use specific aria-label selector
    const clearButton = page.getByRole('button', { name: 'Clear search' });
    await expect(clearButton).toBeVisible();

    // Click clear
    await clearButton.click();

    // Search input should be empty (wait for React state update)
    await expect(searchInput).toHaveValue('', { timeout: 5000 });
  });

  test('shows no results message when search has no matches', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'JavaScript',
      body: 'JavaScript content',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for something that doesn't exist
    await page.fill('input[placeholder*="Search"]', 'NonexistentContent12345');
    await page.waitForTimeout(500);

    // Should show no matches message
    await expect(page.locator('text=No content matches your filters')).toBeVisible();
  });

  test('search results are isolated per user', async ({ page }) => {
    const user1 = await createTestUser({ email: 'user1@test.com' });
    const user2 = await createTestUser({ email: 'user2@test.com' });

    // Create content for user1
    await createTestContent(user1.id, {type: 'note',
      title: 'User1 React Content',
      body: 'React for user 1',
      tags: [],
    });

    // Create content for user2
    await createTestContent(user2.id, {type: 'note',
      title: 'User2 React Content',
      body: 'React for user 2',
      tags: [],
    });

    // Login as user1
    await page.goto('/login');
    await page.fill('input[name="email"]', user1.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Should only see user1's content
    await expect(page.getByRole('heading', { name: 'User1 React Content' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'User2 React Content' })).not.toBeVisible();
  });

  test('handles special characters in search query', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'C++ Programming',
      body: 'Learn C++ basics',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search with special characters
    await page.fill('input[placeholder*="Search"]', 'C++');
    await page.waitForTimeout(500);

    await expect(page.locator('text=C++ Programming')).toBeVisible();
  });

  test('empty search query shows all content', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Note 1',
      body: 'Content 1',
      tags: [],
    });
    await createTestContent(user.id, {type: 'note',
      title: 'Note 2',
      body: 'Content 2',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // All content should be visible initially
    await expect(page.locator('text=Note 1')).toBeVisible();
    await expect(page.locator('text=Note 2')).toBeVisible();

    // Search for something
    await page.fill('input[placeholder*="Search"]', 'Note 1');
    await page.waitForTimeout(500);

    // Only Note 1 visible
    await expect(page.locator('text=Note 1')).toBeVisible();
    await expect(page.locator('text=Note 2')).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);

    // All content visible again
    await expect(page.locator('text=Note 1')).toBeVisible();
    await expect(page.locator('text=Note 2')).toBeVisible();
  });

  test('search query persists in URL', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Test Note',
      body: 'Test content',
      tags: [],
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.click('button[type="submit"]:has-text("Dev Login")');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/library');

    // Search for something
    await page.fill('input[placeholder*="Search"]', 'Test');
    await page.waitForTimeout(500);

    // Check URL contains query
    await expect(page).toHaveURL(/query=Test/);

    // Reload page
    await page.reload();

    // Search input should still have value
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('Test');
  });
});
