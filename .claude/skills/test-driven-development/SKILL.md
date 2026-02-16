---
name: test-driven-development
description: Apply test-driven development practices when writing or modifying code. Use this skill when implementing new features, fixing bugs, or refactoring to ensure code is written with tests first. Triggers on tasks involving new functionality, bug fixes, or code changes that need test coverage.
---

# Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle for all code changes.

## TDD Workflow

### 1. Red: Write a Failing Test First
- Before writing any implementation code, write a test that describes the desired behavior
- The test MUST fail initially (if it passes, the test is not testing new behavior)
- Keep tests small and focused on one behavior
- Name tests descriptively: `it('should return empty array when user has no content')`

### 2. Green: Write Minimal Code to Pass
- Write the simplest implementation that makes the failing test pass
- Do NOT add extra functionality beyond what the test requires
- Do NOT optimize at this stage
- Run the test to confirm it passes

### 3. Refactor: Improve the Code
- Clean up the implementation while keeping tests green
- Remove duplication, improve naming, simplify logic
- Run all tests after each refactoring step to ensure nothing breaks
- Do NOT add new behavior during refactoring

## Testing Principles

### Test Structure (Arrange-Act-Assert)
```typescript
it('should generate tags for note content', async () => {
  // Arrange: Set up test data and mocks
  const input = { title: 'React Hooks', body: 'useState and useEffect...' };

  // Act: Execute the function under test
  const tags = await generateTags(input);

  // Assert: Verify the expected outcome
  expect(tags).toContain('react');
  expect(tags.length).toBeGreaterThan(0);
});
```

### What to Test
- **Happy path**: Normal expected behavior
- **Edge cases**: Empty inputs, null values, boundary conditions
- **Error cases**: Invalid inputs, API failures, database errors
- **Return values**: Correct output for given input
- **Side effects**: Database writes, API calls, state changes

### What NOT to Test
- Implementation details (private methods, internal state)
- Third-party library internals
- Trivial getters/setters with no logic
- Framework behavior (Next.js routing, React rendering)

### Test Isolation
- Each test must be independent — no shared mutable state
- Use `beforeEach` to reset mocks and state
- Mock external dependencies (database, APIs, file system)
- Tests should pass in any order

### Coverage Targets
- Minimum 80% code coverage for all features
- 100% coverage for critical paths (auth, payments, data mutations)
- Focus on meaningful coverage, not just line counts

## Commands
```bash
pnpm --filter web test              # Run all tests
pnpm --filter web test:watch        # Watch mode for TDD cycle
pnpm --filter web test:coverage     # Check coverage
```

## Anti-Patterns to Avoid
- Writing tests after implementation (test-after is not TDD)
- Testing implementation details instead of behavior
- Large tests that test multiple behaviors
- Skipping the refactor step
- Ignoring failing tests ("I'll fix it later")
- Mocking everything (test real integrations where practical)
