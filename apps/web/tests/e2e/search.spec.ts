import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent } from '../helpers/db';

test.describe('Full-text Search', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test('displays search bar in library page', async ({ page }) => {
    const user = await createTestUser();

    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for "React"
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500); // Wait for debounce

    // Should show only React content
    await expect(page.locator('text=React Hooks Tutorial')).toBeVisible();
    await expect(page.locator('text=Vue Composition API')).not.toBeVisible();
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search by body content
    await page.fill('input[placeholder*="Search"]', 'TypeScript');
    await page.waitForTimeout(500);

    await expect(page.locator('text=JavaScript')).toBeVisible();
    await expect(page.locator('text=Python')).not.toBeVisible();
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search with lowercase
    await page.fill('input[placeholder*="Search"]', 'javascript');
    await page.waitForTimeout(500);
    await expect(page.locator('text=JavaScript Basics')).toBeVisible();

    // Search with uppercase
    await page.fill('input[placeholder*="Search"]', 'JAVASCRIPT');
    await page.waitForTimeout(500);
    await expect(page.locator('text=JavaScript Basics')).toBeVisible();

    // Search with mixed case
    await page.fill('input[placeholder*="Search"]', 'JaVaScRiPt');
    await page.waitForTimeout(500);
    await expect(page.locator('text=JavaScript Basics')).toBeVisible();
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Both should be visible
    await expect(page.locator('text=React Note')).toBeVisible();
    await expect(page.locator('text=React Link')).toBeVisible();

    // Filter by note type
    await page.click('text=Note');

    // Only note should be visible
    await expect(page.locator('text=React Note')).toBeVisible();
    await expect(page.locator('text=React Link')).not.toBeVisible();
  });

  test('combines search with tag filter', async ({ page }) => {
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Both should be visible
    await expect(page.locator('text=React TypeScript')).toBeVisible();
    await expect(page.locator('text=React JavaScript')).toBeVisible();

    // Filter by typescript tag
    await page.click('text=typescript');

    // Only TypeScript one should be visible
    await expect(page.locator('text=React TypeScript')).toBeVisible();
    await expect(page.locator('text=React JavaScript')).not.toBeVisible();
  });

  test('combines search with sorting', async ({ page }) => {
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Sort by title A-Z
    await page.selectOption('select', 'title-asc');
    await page.waitForTimeout(300);

    // Check order (Apple should be first)
    const cards = page.locator('[data-testid="content-card"]');
    await expect(cards.first()).toContainText('Apple React');

    // Sort by title Z-A
    await page.selectOption('select', 'title-desc');
    await page.waitForTimeout(300);

    // Check order (Zebra should be first)
    await expect(cards.first()).toContainText('Zebra React');
  });

  test('clears search with X button', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'Test Note',
      body: 'Test content',
      tags: [],
    });

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for something
    await page.fill('input[placeholder*="Search"]', 'Test');
    await page.waitForTimeout(500);

    // Clear button should be visible
    const clearButton = page.locator('button[aria-label="Clear search"], button:has-text("Clear")').or(page.locator('button:has(svg) >> nth=1'));
    await expect(clearButton.first()).toBeVisible();

    // Click clear
    await clearButton.first().click();

    // Search input should be empty
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });

  test('shows no results message when search has no matches', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'JavaScript',
      body: 'JavaScript content',
      tags: [],
    });

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user1.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard/library');

    // Search for React
    await page.fill('input[placeholder*="Search"]', 'React');
    await page.waitForTimeout(500);

    // Should only see user1's content
    await expect(page.locator('text=User1 React Content')).toBeVisible();
    await expect(page.locator('text=User2 React Content')).not.toBeVisible();
  });

  test('handles special characters in search query', async ({ page }) => {
    const user = await createTestUser();

    await createTestContent(user.id, {type: 'note',
      title: 'C++ Programming',
      body: 'Learn C++ basics',
      tags: [],
    });

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
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
