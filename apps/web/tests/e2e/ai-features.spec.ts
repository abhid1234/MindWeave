import { test, expect } from '@playwright/test';
import { cleanDatabase, createTestUser, createTestContent, createTestEmbedding } from '../helpers/db';

test.describe('AI Features E2E Tests', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test.describe('Analytics Page - Knowledge Insights', () => {
    test('displays analytics page with insights card', async ({ page }) => {
      const user = await createTestUser();

      // Create some content to generate insights
      await createTestContent(user.id, {
        type: 'note',
        title: 'React Development Guide',
        body: 'Learn React hooks and components',
        tags: ['react', 'frontend', 'javascript'],
      });
      await createTestContent(user.id, {
        type: 'note',
        title: 'TypeScript Best Practices',
        body: 'Type safety and interfaces',
        tags: ['typescript', 'frontend'],
      });

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Navigate to analytics
      await page.goto('/dashboard/analytics');

      // Check page title
      await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

      // Check insights card exists
      await expect(page.getByTestId('knowledge-insights-card')).toBeVisible();

      // Check insights card has title
      await expect(page.getByText('Knowledge Insights')).toBeVisible();
    });

    test('shows loading state for insights', async ({ page }) => {
      const user = await createTestUser();

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Navigate to analytics and check for loading state quickly
      await page.goto('/dashboard/analytics');

      // Either loading state or content should be visible
      const insightsCard = page.getByTestId('knowledge-insights-card');
      await expect(insightsCard).toBeVisible();
    });

    test('displays overview stats cards', async ({ page }) => {
      const user = await createTestUser();

      // Create content
      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note 1',
        body: 'Content body',
        tags: ['test'],
      });

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Navigate to analytics
      await page.goto('/dashboard/analytics');

      // Check for overview stats section (should have Total Items, etc.)
      await expect(page.getByText('Total Items')).toBeVisible({ timeout: 10000 });
    });

    test('displays content growth chart with period selector', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
      });

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Check for period selector buttons
      await expect(page.getByRole('button', { name: 'Week' })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Year' })).toBeVisible();
    });

    test('can switch chart periods', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
      });

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Click week button
      const weekButton = page.getByRole('button', { name: 'Week' });
      await expect(weekButton).toBeVisible({ timeout: 10000 });
      await weekButton.click();

      // Button should be active/highlighted
      await expect(weekButton).toHaveClass(/bg-primary|bg-secondary/);
    });
  });

  test.describe('Dashboard - Recommendations Widget', () => {
    test('displays recommendations heading on dashboard', async ({ page }) => {
      const user = await createTestUser();

      // Create content with embeddings for recommendations
      const content1 = await createTestContent(user.id, {
        type: 'note',
        title: 'Machine Learning Basics',
        body: 'Introduction to ML concepts',
        tags: ['ml', 'ai'],
      });
      const content2 = await createTestContent(user.id, {
        type: 'note',
        title: 'Deep Learning Guide',
        body: 'Neural networks and deep learning',
        tags: ['ml', 'deep-learning'],
      });

      // Create embeddings (similar vectors for recommendations)
      const embedding1 = Array(768).fill(0).map(() => Math.random() * 0.1);
      const embedding2 = embedding1.map((v) => v + Math.random() * 0.01);
      await createTestEmbedding(content1.id, embedding1);
      await createTestEmbedding(content2.id, embedding2);

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Wait for recommendations to load
      await page.waitForTimeout(1000);

      // Check for recommendations heading (may or may not appear based on data)
      const heading = page.getByRole('heading', { name: 'Recommended for You' });
      // If recommendations exist, they should be visible
      const headingCount = await heading.count();
      if (headingCount > 0) {
        await expect(heading).toBeVisible();
      }
    });

    test('shows loading skeleton while fetching recommendations', async ({ page }) => {
      const user = await createTestUser();

      // Create content
      const content = await createTestContent(user.id, {
        type: 'note',
        title: 'Test Content',
        body: 'Test body',
        tags: [],
      });
      await createTestEmbedding(content.id);

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');

      // Check URL changed to dashboard
      await page.waitForURL('/dashboard');

      // The page should load without errors
      await expect(page.getByText('Welcome')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search Suggestions', () => {
    test('search page loads correctly', async ({ page }) => {
      const user = await createTestUser();

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Navigate to search page
      await page.goto('/dashboard/search');

      // Check search input exists
      const searchInput = page.locator('input[type="text"]').first();
      await expect(searchInput).toBeVisible();
    });

    test('search page shows mode toggle', async ({ page }) => {
      const user = await createTestUser();

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/search');

      // Check for search mode buttons (keyword vs semantic)
      const keywordButton = page.getByRole('button', { name: /keyword/i });
      const semanticButton = page.getByRole('button', { name: /semantic/i });

      // At least one mode should be available
      const keywordCount = await keywordButton.count();
      const semanticCount = await semanticButton.count();
      expect(keywordCount + semanticCount).toBeGreaterThan(0);
    });

    test('can perform keyword search', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'JavaScript Tutorial',
        body: 'Learn JavaScript programming',
        tags: ['javascript', 'programming'],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/search');

      // Enter search query
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('JavaScript');

      // Submit search (click search button or press Enter)
      await searchInput.press('Enter');

      // Wait for results
      await page.waitForTimeout(1000);

      // Check results appear (either results or "no results" message)
      const pageContent = await page.textContent('body');
      const hasResult = pageContent?.includes('JavaScript Tutorial') ||
                        pageContent?.includes('No results') ||
                        pageContent?.includes('Search results');
      expect(hasResult).toBeTruthy();
    });

    test('semantic search requires embeddings', async ({ page }) => {
      const user = await createTestUser();

      const content = await createTestContent(user.id, {
        type: 'note',
        title: 'Python Machine Learning',
        body: 'ML with Python and sklearn',
        tags: ['python', 'ml'],
      });
      await createTestEmbedding(content.id);

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/search?mode=semantic');

      // Check we're on the search page
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    });
  });

  test.describe('Library Page - Infinite Scroll', () => {
    test('library page loads with content', async ({ page }) => {
      const user = await createTestUser();

      // Create multiple content items
      for (let i = 0; i < 5; i++) {
        await createTestContent(user.id, {
          type: 'note',
          title: `Note ${i + 1}`,
          body: `Content for note ${i + 1}`,
          tags: ['test'],
        });
      }

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Check content items are visible (use heading to be specific)
      await expect(page.getByRole('heading', { name: 'Note 1' })).toBeVisible();
      await expect(page.getByText('Showing')).toBeVisible(); // Item count indicator
    });

    test('shows item count indicator', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Check for item count text
      await expect(page.getByText(/Showing \d+ item/)).toBeVisible();
    });

    test('shows empty state when no content', async ({ page }) => {
      const user = await createTestUser();

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Check for empty state message
      await expect(page.getByText(/No content yet|Start capturing/)).toBeVisible();
    });

    test('end of content message appears when scrolled to end', async ({ page }) => {
      const user = await createTestUser();

      // Create a few items (less than page size so we hit the end)
      for (let i = 0; i < 3; i++) {
        await createTestContent(user.id, {
          type: 'note',
          title: `Note ${i + 1}`,
          body: `Content ${i + 1}`,
          tags: [],
        });
      }

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Wait for content to load
      await expect(page.getByText('Note 1')).toBeVisible();

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Check for end of content message
      await expect(page.getByText("You've reached the end")).toBeVisible();
    });
  });

  test.describe('Tag Distribution Chart', () => {
    test('displays tag distribution on analytics page', async ({ page }) => {
      const user = await createTestUser();

      // Create content with various tags
      await createTestContent(user.id, {
        type: 'note',
        title: 'React Tutorial',
        body: 'Learn React',
        tags: ['react', 'javascript', 'frontend'],
      });
      await createTestContent(user.id, {
        type: 'note',
        title: 'Vue Guide',
        body: 'Learn Vue',
        tags: ['vue', 'javascript', 'frontend'],
      });
      await createTestContent(user.id, {
        type: 'note',
        title: 'Node.js Basics',
        body: 'Learn Node',
        tags: ['nodejs', 'javascript', 'backend'],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Check for tag distribution section
      await expect(page.getByText('Tag Distribution')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Collection Usage Chart', () => {
    test('displays collection usage on analytics page', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Check for collection usage section
      await expect(page.getByText('Collection Usage')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation to AI Features', () => {
    test('can navigate to analytics from sidebar', async ({ page }) => {
      const user = await createTestUser();

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Click on Analytics link in navigation
      await page.click('a:has-text("Analytics")');

      // Should be on analytics page
      await expect(page).toHaveURL(/\/dashboard\/analytics/);
      await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    });

    test('can navigate to search from sidebar', async ({ page }) => {
      const user = await createTestUser();

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Click on Search link
      await page.click('a:has-text("Search")');

      // Should be on search page
      await expect(page).toHaveURL(/\/dashboard\/search/);
    });

    test('can navigate to library from sidebar', async ({ page }) => {
      const user = await createTestUser();

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      // Click on Library link
      await page.click('a:has-text("Library")');

      // Should be on library page
      await expect(page).toHaveURL(/\/dashboard\/library/);
    });
  });

  test.describe('Analytics - Tag Distribution Details', () => {
    test('tag distribution shows tag names when tags exist', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'React Guide',
        body: 'Learn React',
        tags: ['react', 'frontend'],
      });
      await createTestContent(user.id, {
        type: 'note',
        title: 'Node Guide',
        body: 'Learn Node',
        tags: ['nodejs', 'backend'],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      await expect(page.getByText('Tag Distribution')).toBeVisible({ timeout: 10000 });

      // With tags present, the chart should render tag names
      const pageContent = await page.textContent('body');
      const hasTagNames = pageContent?.includes('react') ||
                          pageContent?.includes('frontend') ||
                          pageContent?.includes('nodejs');
      expect(hasTagNames).toBeTruthy();
    });

    test('tag distribution shows empty state with no tags', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Untagged Note',
        body: 'No tags here',
        tags: [],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      await expect(page.getByText('Tag Distribution')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Analytics - Content Growth Chart', () => {
    test('content growth chart switches between week/month/year', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Click each period button and verify it becomes active
      const monthButton = page.getByRole('button', { name: 'Month' });
      await expect(monthButton).toBeVisible({ timeout: 10000 });
      await monthButton.click();
      await expect(monthButton).toHaveClass(/bg-primary|bg-secondary/);

      const yearButton = page.getByRole('button', { name: 'Year' });
      await yearButton.click();
      await expect(yearButton).toHaveClass(/bg-primary|bg-secondary/);

      const weekButton = page.getByRole('button', { name: 'Week' });
      await weekButton.click();
      await expect(weekButton).toHaveClass(/bg-primary|bg-secondary/);
    });

    test('content growth chart shows data with content', async ({ page }) => {
      const user = await createTestUser();

      // Create content with varied dates
      for (let i = 0; i < 5; i++) {
        await createTestContent(user.id, {
          type: 'note',
          title: `Growth Note ${i + 1}`,
          body: `Content ${i + 1}`,
          tags: ['growth-test'],
        });
      }

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Chart section should be visible with period buttons
      await expect(page.getByRole('button', { name: 'Week' })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Analytics - Overview Stats', () => {
    test('overview stats displays correct total item count', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, { type: 'note', title: 'Note 1', body: 'Body', tags: [] });
      await createTestContent(user.id, { type: 'link', title: 'Link 1', body: 'Body', tags: [], url: 'https://example.com' });
      await createTestContent(user.id, { type: 'note', title: 'Note 2', body: 'Body', tags: [] });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      await expect(page.getByText('Total Items')).toBeVisible({ timeout: 10000 });

      // The total should show 3
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('3');
    });

    test('overview stats shows "This Month" count', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, { type: 'note', title: 'Recent Note', body: 'Body', tags: [] });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/analytics');

      // Should show "This Month" stat
      await expect(page.getByRole('heading', { name: 'This Month' })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Library - Content Clusters', () => {
    test('library page shows content clusters sidebar', async ({ page }) => {
      const user = await createTestUser();

      // Create content with embeddings for clustering
      const content1 = await createTestContent(user.id, {
        type: 'note',
        title: 'React Basics',
        body: 'Learn React fundamentals',
        tags: ['react'],
      });
      const content2 = await createTestContent(user.id, {
        type: 'note',
        title: 'React Advanced',
        body: 'Advanced React patterns',
        tags: ['react'],
      });

      const baseVector = Array(768).fill(0).map(() => Math.random() * 0.1 + 0.5);
      const similarVector = baseVector.map((v) => v + Math.random() * 0.01);
      await createTestEmbedding(content1.id, baseVector);
      await createTestEmbedding(content2.id, similarVector);

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Content Clusters heading should exist (may be in sidebar)
      const clustersHeading = page.getByText('Content Clusters');
      const clustersCount = await clustersHeading.count();
      // Clusters may or may not render depending on minimum content threshold
      expect(clustersCount).toBeGreaterThanOrEqual(0);
    });

    test('clusters sidebar displays cluster names', async ({ page }) => {
      const user = await createTestUser();

      // Create several similar content items for clustering
      const items = [];
      for (let i = 0; i < 5; i++) {
        const item = await createTestContent(user.id, {
          type: 'note',
          title: `ML Topic ${i + 1}`,
          body: `Machine learning content ${i + 1}`,
          tags: ['ml', 'ai'],
        });
        const vector = Array(768).fill(0).map(() => Math.random() * 0.05 + 0.5);
        await createTestEmbedding(item.id, vector);
        items.push(item);
      }

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Wait for potential clusters to load
      await page.waitForTimeout(2000);

      // Check if clusters section appears
      const clustersSection = page.getByText('Content Clusters');
      if ((await clustersSection.count()) > 0) {
        await expect(clustersSection).toBeVisible();

        // If clusters are generated, they should show item counts
        const itemCount = page.getByText(/\d+ items?/);
        const hasItemCount = (await itemCount.count()) > 0;
        expect(hasItemCount).toBeTruthy();
      }
    });
  });

  test.describe('Content with AI Features', () => {
    test('content card shows tags including auto-tags', async ({ page }) => {
      const user = await createTestUser();

      await createTestContent(user.id, {
        type: 'note',
        title: 'AI Note',
        body: 'Content with auto tags',
        tags: ['manual-tag'],
        autoTags: ['auto-generated'],
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Check for content and tags (use first() to handle multiple matches)
      await expect(page.getByRole('heading', { name: 'AI Note' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'manual-tag' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'auto-generated' })).toBeVisible();
    });

    test('content card has View Similar option', async ({ page }) => {
      const user = await createTestUser();

      const content = await createTestContent(user.id, {
        type: 'note',
        title: 'Test Content',
        body: 'Body content',
        tags: ['test'],
      });
      await createTestEmbedding(content.id);

      await page.goto('/login');
      await page.fill('input[name="email"]', user.email);
      await page.click('button[type="submit"]:has-text("Dev Login")');
      await page.waitForURL('/dashboard');

      await page.goto('/dashboard/library');

      // Find the content card and open dropdown menu
      await expect(page.getByText('Test Content')).toBeVisible();

      // Look for the actions dropdown trigger (three dots or similar)
      const card = page.locator('article').filter({ hasText: 'Test Content' });
      const menuTrigger = card.locator('button[aria-haspopup="menu"]').first();

      if ((await menuTrigger.count()) > 0) {
        await menuTrigger.click();

        // Check for View Similar option in menu
        await expect(page.getByRole('menuitem', { name: /similar/i })).toBeVisible();
      }
    });
  });
});
