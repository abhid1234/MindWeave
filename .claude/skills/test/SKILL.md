---
name: test
description: Run the Mindweave test suite
disable-model-invocation: true
---

Run the Mindweave test suite. The test command is:

```
pnpm --filter web test
```

After tests complete, report:
- Total tests passed/failed/skipped
- Any failed test names and their error messages
- Overall duration

If $ARGUMENTS is provided, use it to filter tests:
- `pnpm --filter web test $ARGUMENTS` — run specific test file or pattern

Additional checks the user may request:
- `/test coverage` — run `pnpm --filter web test:coverage`
- `/test lint` — run `pnpm --filter web lint`
- `/test types` — run `pnpm --filter web type-check`
- `/test all` — run tests, lint, and type-check sequentially
