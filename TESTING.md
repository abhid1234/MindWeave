# Testing Strategy

This document outlines the testing strategy for Mindweave, including frameworks, patterns, and requirements.

## Testing Philosophy

**Every feature must be thoroughly tested before merging to main.**

### Core Principles

1. **Test-Driven Development**: Write tests alongside (or before) implementation
2. **High Coverage**: Maintain ≥80% code coverage across the codebase
3. **Fast Feedback**: Tests should run quickly and provide immediate feedback
4. **Comprehensive**: Cover unit, integration, component, and E2E scenarios
5. **Maintainable**: Tests should be clear, well-organized, and easy to update

## Testing Frameworks

### 1. Vitest (Unit & Integration Tests)

**Used for**: Business logic, utilities, API routes, database operations

**Why Vitest?**
- Fast execution with native ESM support
- Compatible with Vite/Next.js
- Jest-compatible API (easy migration)
- Built-in coverage reporting
- Watch mode for development

**Configuration**: `vitest.config.ts`

### 2. React Testing Library (Component Tests)

**Used for**: React components, UI interactions, hooks

**Why React Testing Library?**
- Tests from user perspective
- Encourages accessible components
- Works seamlessly with Vitest
- Community best practice

**Guiding principle**: "Test how users interact, not implementation details"

### 3. Playwright (E2E Tests)

**Used for**: Complete user flows, cross-browser testing, visual regression

**Why Playwright?**
- Fast and reliable
- Cross-browser support (Chrome, Firefox, Safari)
- Auto-wait for elements
- Network interception
- Screenshot/video recording

**Configuration**: `playwright.config.ts`

## Test Coverage Requirements

### Minimum Coverage Thresholds

```javascript
{
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80
}
```

### Coverage by Category

- **Business Logic**: 90%+ (critical functions)
- **API Routes**: 85%+ (all endpoints tested)
- **Database Operations**: 85%+ (CRUD operations)
- **React Components**: 80%+ (rendering and interactions)
- **Utilities**: 90%+ (helper functions)

## Testing Patterns

### 1. Unit Tests

**Location**: `*.test.ts` next to source file

**Example**: Testing utility functions
```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, truncateText } from './utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-01-20');
      expect(formatDate(date)).toBe('Jan 20, 2026');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('Invalid date');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      expect(truncateText(text, 20)).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });
  });
});
```

### 2. Integration Tests

**Location**: `*.test.ts` in API route directories

**Example**: Testing API routes
```typescript
// app/api/content/route.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST, GET } from './route';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';

describe('Content API', () => {
  beforeEach(async () => {
    // Setup test database
    await db.delete(content);
  });

  afterEach(async () => {
    // Cleanup
    await db.delete(content);
  });

  describe('POST /api/content', () => {
    it('should create new content', async () => {
      const request = new Request('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify({
          type: 'note',
          title: 'Test Note',
          body: 'Test content',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Test Note');
    });

    it('should validate required fields', async () => {
      const request = new Request('http://localhost:3000/api/content', {
        method: 'POST',
        body: JSON.stringify({ type: 'note' }), // Missing title
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/content', () => {
    it('should return all content for user', async () => {
      // Create test content
      await db.insert(content).values({
        userId: 'test-user-id',
        type: 'note',
        title: 'Test Note',
      });

      const request = new Request('http://localhost:3000/api/content');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
```

### 3. Component Tests

**Location**: `*.test.tsx` next to component file

**Example**: Testing React components
```typescript
// components/ui/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### 4. E2E Tests

**Location**: `tests/e2e/*.spec.ts`

**Example**: Testing user flows
```typescript
// tests/e2e/note-capture.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Note Capture', () => {
  test('should create a new note', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to capture page
    await page.goto('http://localhost:3000/capture');

    // Fill note form
    await page.fill('[name="title"]', 'My Test Note');
    await page.fill('[name="body"]', 'This is a test note body');

    // Submit
    await page.click('button:has-text("Save Note")');

    // Verify success
    await expect(page.locator('text=Note created successfully')).toBeVisible();

    // Verify note appears in library
    await page.goto('http://localhost:3000/library');
    await expect(page.locator('text=My Test Note')).toBeVisible();
  });

  test('should show validation errors for empty title', async ({ page }) => {
    await page.goto('http://localhost:3000/capture');

    // Try to submit without title
    await page.click('button:has-text("Save Note")');

    // Verify error message
    await expect(page.locator('text=Title is required')).toBeVisible();
  });
});
```

## Test Organization

### Directory Structure

```
apps/web/
├── app/
│   ├── api/
│   │   └── content/
│   │       ├── route.ts
│   │       └── route.test.ts          # API integration tests
│   └── (dashboard)/
│       └── capture/
│           ├── page.tsx
│           └── page.test.tsx           # Component tests
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx             # Component tests
├── lib/
│   ├── ai/
│   │   ├── claude.ts
│   │   └── claude.test.ts              # Unit tests
│   ├── db/
│   │   ├── schema.ts
│   │   └── schema.test.ts              # Unit tests
│   └── utils.ts
│       └── utils.test.ts               # Unit tests
└── tests/
    ├── e2e/
    │   ├── authentication.spec.ts      # E2E tests
    │   ├── note-capture.spec.ts
    │   └── search.spec.ts
    ├── fixtures/
    │   ├── users.ts                    # Test data
    │   └── content.ts
    └── helpers/
        ├── db.ts                       # Test database helpers
        └── setup.ts                    # Test setup utilities
```

## Running Tests

### Development Workflow

```bash
# Run all unit/integration tests in watch mode
npm run test:watch

# Run tests once
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Before Merging

```bash
# Run full test suite in feature branch
npm run test && npm run test:coverage && npm run test:e2e

# Verify coverage meets threshold
# Check coverage report in coverage/index.html
```

### After Merging to Main

**CRITICAL: Always run the complete test suite in main after every merge**

```bash
# After merging feature branch to main
git checkout main

# Run ALL tests to catch regressions
npm run test              # Unit & integration tests
npm run test:e2e          # E2E tests
npm run test:coverage     # Verify coverage ≥ 80%
npm run type-check        # TypeScript validation
npm run lint              # Code quality
npm run build             # Production build
```

**Why this is critical:**
- Detects integration issues between features
- Catches regressions in previously working code
- Ensures main branch is always stable and deployable
- Prevents cascading failures in future features

**If tests fail in main:**
1. ⚠️ STOP - Do not start next feature
2. Investigate why tests passed in feature branch but failed in main
3. Fix the issue immediately in main branch
4. Re-run all tests until they pass
5. Only then proceed to next feature

## Test Data Management

### Database Fixtures

Create reusable test data in `tests/fixtures/`:

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  alice: {
    id: 'user-alice-id',
    name: 'Alice Johnson',
    email: 'alice@example.com',
  },
  bob: {
    id: 'user-bob-id',
    name: 'Bob Smith',
    email: 'bob@example.com',
  },
};

// tests/fixtures/content.ts
export const testContent = {
  aliceNote: {
    userId: testUsers.alice.id,
    type: 'note',
    title: 'Alice Test Note',
    body: 'This is Alice test note',
    tags: ['test', 'example'],
  },
};
```

### Database Helpers

Create test database utilities in `tests/helpers/db.ts`:

```typescript
import { db } from '@/lib/db/client';
import { content, users } from '@/lib/db/schema';

export async function cleanDatabase() {
  await db.delete(content);
  await db.delete(users);
}

export async function seedTestData() {
  // Seed test users and content
  await db.insert(users).values(testUsers.alice);
  await db.insert(content).values(testContent.aliceNote);
}

export async function createTestUser(data: Partial<User>) {
  const [user] = await db.insert(users).values({
    name: 'Test User',
    email: 'test@example.com',
    ...data,
  }).returning();
  return user;
}
```

## Mocking

### API Calls

```typescript
import { vi } from 'vitest';
import * as claude from '@/lib/ai/claude';

vi.mock('@/lib/ai/claude', () => ({
  generateTags: vi.fn().mockResolvedValue(['ai', 'testing']),
  answerQuestion: vi.fn().mockResolvedValue('Mocked answer'),
}));
```

### Environment Variables

```typescript
vi.stubEnv('GOOGLE_AI_API_KEY', 'test-api-key');
vi.stubEnv('DATABASE_URL', 'postgresql://test-db-url');
```

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what's being tested:

✅ **Good**:
```typescript
it('should return 401 when user is not authenticated')
it('should create note with auto-generated tags')
it('should display error message for invalid email')
```

❌ **Bad**:
```typescript
it('works correctly')
it('test note creation')
it('should pass')
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
it('should update content title', async () => {
  // Arrange
  const content = await createTestContent({ title: 'Old Title' });

  // Act
  const updated = await updateContent(content.id, { title: 'New Title' });

  // Assert
  expect(updated.title).toBe('New Title');
});
```

### 3. Test Independence

Each test should be independent and isolated:

```typescript
describe('Content API', () => {
  beforeEach(async () => {
    await cleanDatabase(); // Start fresh
  });

  afterEach(async () => {
    await cleanDatabase(); // Cleanup
  });

  it('test 1', async () => { /* ... */ });
  it('test 2', async () => { /* ... */ }); // Doesn't depend on test 1
});
```

### 4. Avoid Testing Implementation Details

❌ **Bad** (testing implementation):
```typescript
it('should call setState with new value', () => {
  const { result } = renderHook(() => useState(0));
  // Don't test internal state management
});
```

✅ **Good** (testing behavior):
```typescript
it('should increment counter when button is clicked', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 5. Use Testing Library Queries Properly

**Query Priority** (in order of preference):
1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

## Coverage Reports

### Viewing Coverage

```bash
npm run test:coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test:coverage

      - name: Check coverage threshold
        run: npm run test:coverage -- --reporter=json --outputFile=coverage.json

      - name: Run E2E tests
        run: npm run test:e2e
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
