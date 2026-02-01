# Ralph - Autonomous AI Agent

Ralph is an autonomous AI agent that implements product requirements iteratively with comprehensive testing and quality assurance.

## Quick Start

```bash
# Run Ralph with default settings (10 iterations)
./scripts/ralph/ralph.sh

# Run with more iterations
./scripts/ralph/ralph.sh 20

# Or use skill command
/ralph-loop
```

## What Ralph Does

Ralph automates the feature development workflow:

1. ✅ Reads product requirements from `prd.json`
2. ✅ Selects highest-priority incomplete story
3. ✅ Creates feature branch
4. ✅ Implements with TDD (tests first, ≥80% coverage)
5. ✅ Runs all quality checks (tests, types, lint, build)
6. ✅ Merges to main and verifies no regressions
7. ✅ Updates task status in `prd.json`
8. ✅ Logs learnings to `progress.txt`
9. ✅ Commits metadata
10. ✅ Continues to next story

## Files

```
scripts/ralph/
├── ralph.sh              # Main execution script (bash loop)
├── CLAUDE.md             # Prompt template for AI agent
├── prd.json              # Product requirements and task status
├── progress.txt          # Learning log from iterations
├── .last-branch          # Branch tracking (auto-generated)
├── archive/              # Archived runs (auto-generated)
└── README.md             # This file
```

## Usage

### Start Ralph Loop

```bash
# From project root
./scripts/ralph/ralph.sh

# With custom settings
./scripts/ralph/ralph.sh --max-iterations 20
./scripts/ralph/ralph.sh --tool claude  # or --tool amp

# Shorthand for iterations
./scripts/ralph/ralph.sh 15
```

**Options:**
- `--max-iterations N` - Maximum iterations (default: 10)
- `--tool NAME` - Tool to use: `claude` or `amp` (default: `claude`)

### Check Status

```bash
# View Ralph's progress
/ralph-status

# Or manually check files
cat scripts/ralph/prd.json | jq '.stories[] | select(.passes == false)'
cat scripts/ralph/progress.txt
```

### Manage Product Requirements

```bash
# View all stories
/ralph-prd

# View specific story
/ralph-prd view feature-4

# Add new story
/ralph-prd add

# Edit story
/ralph-prd edit feature-4

# Mark complete/incomplete
/ralph-prd complete feature-4
/ralph-prd incomplete feature-4
```

## Product Requirements (prd.json)

Define your stories in `prd.json`:

```json
{
  "branch": "main",
  "title": "Project Title",
  "description": "Project description",
  "stories": [
    {
      "id": "feature-4",
      "title": "Full-text Search",
      "description": "Implement basic keyword search...",
      "acceptance_criteria": [
        "Search bar component",
        "Server action for search",
        "≥80% test coverage",
        "All quality checks passing"
      ],
      "priority": 1,
      "passes": false,
      "completed_at": null
    }
  ]
}
```

### Story Fields

- **id**: Unique identifier (e.g., `"feature-4"`)
- **title**: Short name (e.g., `"Full-text Search"`)
- **description**: Detailed explanation
- **acceptance_criteria**: Array of specific requirements
- **priority**: Number (1 = highest)
- **passes**: `true` = complete, `false` = incomplete
- **completed_at**: ISO timestamp or `null`

### Writing Good Acceptance Criteria

**Always include:**
- Specific functionality to implement
- UI components needed
- Server actions/API routes
- Database changes (if applicable)
- Unit tests (≥80% coverage)
- Component tests (≥80% coverage)
- Integration tests
- E2E tests for critical flows
- All quality checks passing (tests, types, lint, build)

**Example:**
```json
"acceptance_criteria": [
  "Search bar component in library page",
  "Server action that performs full-text search on content table",
  "Search across title, body, tags, and autoTags fields",
  "Display search results with highlighting",
  "URL parameter persistence for search queries",
  "Empty state for no search results",
  "Unit tests for search logic (≥80% coverage)",
  "Component tests for search UI (≥80% coverage)",
  "E2E tests for complete search flow",
  "All quality checks passing (tests, types, lint, build)"
]
```

## Progress Log (progress.txt)

Ralph appends learnings after each iteration:

```
## Iteration 3 - 2026-01-21T12:00:00Z
Story: feature-4 (Full-text Search)
Status: Complete
Coverage: 85.2%

### What Worked
- PostgreSQL full-text search with ts_rank
- Combined keyword and filter search

### Challenges
- URL encoding for special characters
- Test coverage initially at 75%

### Learnings
- Use to_tsquery() for proper operator handling
- Mock searchParams with 'as any' in tests

### Gotchas
- Remember to index tsvector columns
- Search needs debouncing in UI
```

**Use this to:**
- Learn from previous iterations
- Avoid repeating mistakes
- Understand what patterns work well
- Debug issues

## Quality Standards

Ralph enforces these standards for every story:

### Testing (≥80% coverage)
- ✅ Unit tests for all business logic
- ✅ Component tests for React components
- ✅ Integration tests for API routes
- ✅ E2E tests for critical flows
- ✅ All tests passing in feature branch
- ✅ All tests passing in main after merge

### Code Quality
- ✅ TypeScript strict mode
- ✅ Zero ESLint warnings
- ✅ Production build successful
- ✅ No console errors

### Git Hygiene
- ✅ Feature branch for each story
- ✅ Descriptive commit messages
- ✅ No fast-forward merges (`--no-ff`)
- ✅ Main branch always stable

## Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/story-name
```

### 2. Implement with TDD
1. Write tests FIRST
2. Run tests (should fail)
3. Implement code
4. Run tests (should pass)
5. Refactor
6. Verify coverage ≥80%

### 3. Run Quality Checks
```bash
npm test              # All tests pass
npm run test:coverage # Coverage ≥ 80%
npm run type-check    # No TypeScript errors
npm run lint          # No ESLint warnings
npm run build         # Build succeeds
```

### 4. Merge to Main
```bash
git checkout main
git merge feature/story-name --no-ff
git push origin main
git branch -d feature/story-name
```

### 5. Verify in Main
```bash
# CRITICAL: Run ALL tests in main
npm test
npm run test:e2e
npm run test:coverage
npm run type-check
npm run lint
npm run build
```

**If tests fail in main:** STOP and fix immediately.

### 6. Update Status
Edit `prd.json`:
```json
{
  "id": "feature-4",
  "passes": true,
  "completed_at": "2026-01-21T12:00:00Z"
}
```

### 7. Log Progress
Append to `progress.txt` (see format above).

### 8. Commit Metadata
```bash
git add scripts/ralph/prd.json scripts/ralph/progress.txt
git commit -m "chore: Update Ralph task status for story-name

Story: [Brief description]
Status: Complete
Coverage: [X]%

Co-Authored-By: Ralph AI <ralph@mindweave.dev>"
```

### 9. Continue
Ralph automatically moves to the next story.

## Completion

Ralph signals completion with:
```
<promise>COMPLETE</promise>
```

This happens when all stories in `prd.json` have `"passes": true`.

## Error Handling

### If Tests Fail
- ❌ DO NOT mark story as complete
- ❌ DO NOT proceed to next story
- ✅ Fix the issue immediately
- ✅ Re-run all quality checks

### If Build Fails
- Review TypeScript errors
- Check for missing dependencies
- Verify import paths
- Fix and rebuild

### If Coverage < 80%
- Write additional tests
- Focus on untested branches
- Test edge cases and error paths
- Review coverage report

### If Merge Creates Regressions
- Revert merge if needed
- Fix regression in new commit
- Re-run full test suite
- Never leave main branch broken

## Branch Change Detection

Ralph automatically detects branch changes and archives previous runs:

```
scripts/ralph/archive/
├── main_20260120_143000/
│   ├── progress.txt
│   └── prd.json
└── feature-search_20260121_090000/
    ├── progress.txt
    └── prd.json
```

To reset tracking:
```bash
rm scripts/ralph/.last-branch
```

## Troubleshooting

### Ralph stops early
**Check:**
- `progress.txt` for errors or blockers
- Last iteration's output
- Git status and uncommitted changes

**Fix:**
- Review error messages
- Fix blockers manually
- Run more iterations

### Max iterations reached
**Solutions:**
1. Increase iterations: `./scripts/ralph/ralph.sh 20`
2. Review `progress.txt` for blockers
3. Finish remaining stories manually
4. Update `prd.json` with clearer acceptance criteria

### Ralph marks story complete but tests fail
**Fix:**
1. Mark story incomplete: `/ralph-prd incomplete feature-X`
2. Fix the issue manually
3. Re-run Ralph or complete manually

### Tests pass in feature branch but fail in main
**This should not happen but if it does:**
1. Check for uncommitted changes
2. Ensure feature branch was up-to-date with main
3. Review merge conflicts
4. Fix in new commit on main
5. Update acceptance criteria to catch this next time

## Best Practices

### Before Running Ralph

1. ✅ Review stories in `prd.json`
2. ✅ Ensure acceptance criteria are clear
3. ✅ Check `progress.txt` for previous learnings
4. ✅ Ensure main branch is clean and stable
5. ✅ Commit any uncommitted work

### While Ralph Runs

1. ✅ Monitor output for errors
2. ✅ Don't interrupt mid-iteration
3. ✅ Let Ralph complete one story before stopping
4. ✅ Check `progress.txt` periodically

### After Ralph Runs

1. ✅ Review what was completed (`/ralph-status`)
2. ✅ Read `progress.txt` for learnings
3. ✅ Verify all tests still pass in main
4. ✅ Update project documentation (README.md, STATUS.md)
5. ✅ Commit any manual fixes separately

### Writing Stories

1. ✅ Clear, specific acceptance criteria
2. ✅ One feature per story (don't combine)
3. ✅ Realistic scope (break large features down)
4. ✅ Always include test coverage requirement (≥80%)
5. ✅ Always include quality checks requirement
6. ✅ Prioritize properly (don't make everything priority 1)

## Skills (Commands)

Ralph provides these skill commands:

- `/ralph-loop` - Start Ralph autonomous loop
- `/ralph-status` - Check progress and completed stories
- `/ralph-prd` - View/edit product requirements

See `~/.claude/skills/ralph-*.md` for detailed skill documentation.

## Integration with Mindweave

Ralph is designed specifically for the Mindweave project:

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.5
- **Database**: PostgreSQL 16 + pgvector
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5
- **Testing**: Vitest + React Testing Library + Playwright
- **Styling**: Tailwind CSS + shadcn/ui

See `AGENTS.md` for complete Ralph documentation and patterns.

## Related Documentation

- **[AGENTS.md](/home/abhidaas/Workspace/ClaudeCode/Mindweave/AGENTS.md)** - Complete Ralph documentation and conventions
- **[CLAUDE.md](CLAUDE.md)** - Prompt template that Ralph uses
- **[prd.json](prd.json)** - Current product requirements
- **[progress.txt](progress.txt)** - Learning log
- **[~/.claude/skills/](~/.claude/skills/)** - Ralph skills

## Example Session

```bash
# 1. Review current status
/ralph-status

# Output:
# Summary
# -------
# Total stories: 6
# Completed: 3 (50%)
# Remaining: 3
# Next: feature-4 (Full-text Search)

# 2. Review next story
/ralph-prd view feature-4

# Output:
# Story: feature-4
# Title: Full-text Search
# Priority: 1
# Status: Incomplete
# Acceptance Criteria: 11 items

# 3. Start Ralph
./scripts/ralph/ralph.sh 10

# Output:
# ╔════════════════════════════════════════╗
# ║         Ralph Agent Loop v1.0          ║
# ╚════════════════════════════════════════╝
#
# Stories: 3 incomplete / 6 total
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Iteration 1 of 10
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Running claude CLI...
# [Ralph implements feature-4]
# [All tests pass, coverage 85%]
# [Merged to main, no regressions]
# [Status updated in prd.json]
#
# ✓ Story complete!
#
# ...continues to next story...

# 4. Check status after Ralph finishes
/ralph-status

# Output:
# Summary
# -------
# Total stories: 6
# Completed: 4 (67%)
# Remaining: 2

# 5. Review learnings
cat scripts/ralph/progress.txt
```

## Tips & Tricks

### Speed Up Development

1. **Batch similar stories**: Group related features for better context
2. **Clear criteria**: Specific acceptance criteria = faster implementation
3. **Learn from progress**: Review `progress.txt` regularly
4. **Adjust iterations**: Use more iterations for complex features

### Improve Quality

1. **Comprehensive criteria**: Include all test types in acceptance criteria
2. **Edge cases**: Explicitly list edge cases to test
3. **Quality gates**: Always include "all checks passing" in criteria
4. **Manual review**: Don't blindly trust Ralph - review the code

### Debug Issues

1. **Check logs**: Ralph outputs everything to stdout/stderr
2. **Review progress**: `progress.txt` often contains clues
3. **Verify status**: Ensure `prd.json` matches reality
4. **Clean state**: If confused, start fresh with clean main branch

### Cost Management

Ralph uses AI API calls:
- Monitor API usage in Anthropic console
- Adjust max iterations to control costs
- Use manual development for simple features
- Let Ralph handle complex, test-heavy features

## FAQ

**Q: Can I stop Ralph mid-iteration?**
A: Yes (Ctrl+C), but it may leave work incomplete. Better to let it finish the current story.

**Q: What if Ralph marks a story complete but it's not?**
A: Use `/ralph-prd incomplete feature-X` to reset, then fix manually.

**Q: How do I skip a story?**
A: Edit `prd.json` and increase the priority of the story you want to skip (or decrease priority of the one you want first).

**Q: Can I run Ralph on multiple branches?**
A: Yes, change the `"branch"` field in `prd.json`. Ralph will archive the previous branch's run.

**Q: What if I want to add stories while Ralph is running?**
A: Stop Ralph, add stories to `prd.json`, restart Ralph.

**Q: How do I know if Ralph is done?**
A: Ralph outputs `<promise>COMPLETE</promise>` when all stories pass.

**Q: Can I use Ralph for other projects?**
A: The bash script is generic, but `CLAUDE.md` is Mindweave-specific. You'd need to adapt the prompt.

## Support

For issues or questions:
- Review `AGENTS.md` for detailed documentation
- Check `progress.txt` for previous learnings
- Review Ralph output for error messages
- Post in project discussions or issues

---

**Version**: 1.0
**Last Updated**: 2026-01-21
**Author**: Mindweave Team
