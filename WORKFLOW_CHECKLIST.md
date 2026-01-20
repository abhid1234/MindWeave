# Feature Development Workflow Checklist

Use this checklist for each feature to ensure all steps are completed properly.

---

## Feature: ________________________

**Feature Branch**: `feature/_________________`

---

### ☐ Step 1: Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/[feature-name]
```

**Verify:**
- [ ] On correct branch (`git branch` shows feature branch)
- [ ] Up to date with main

---

### ☐ Step 2: Build the Feature

**Development:**
- [ ] Start development server (`npm run dev`)
- [ ] Use `/ralph-loop` for iterative development
- [ ] Implement feature according to specification
- [ ] Follow existing code patterns
- [ ] Add proper TypeScript types
- [ ] Handle error cases
- [ ] Add proper logging where needed

**Code Quality:**
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code
- [ ] Meaningful variable/function names
- [ ] Proper code organization

---

### ☐ Step 3: Write Comprehensive Test Cases

**Unit Tests:**
- [ ] Test all business logic functions
- [ ] Test utility functions
- [ ] Test error handling
- [ ] Test edge cases
- [ ] Coverage ≥ 90% for critical functions

**Integration Tests:**
- [ ] Test API routes
- [ ] Test database operations (CRUD)
- [ ] Test authentication flows
- [ ] Test data validation
- [ ] Coverage ≥ 85% for API routes

**Component Tests:**
- [ ] Test component rendering
- [ ] Test user interactions
- [ ] Test props handling
- [ ] Test conditional rendering
- [ ] Test accessibility
- [ ] Coverage ≥ 80% for components

**E2E Tests:**
- [ ] Test complete user flows
- [ ] Test happy path
- [ ] Test error scenarios
- [ ] Test form validation
- [ ] Test navigation

**Test Development:**
```bash
npm run test:watch        # Watch mode during development
npm run test              # Run all tests
npm run test:coverage     # Check coverage
```

---

### ☐ Step 4: Verify All Quality Checks Pass

**Run all checks in feature branch:**

```bash
# 1. All tests pass
npm run test
# [ ] Passed ✓

# 2. Coverage meets threshold
npm run test:coverage
# [ ] Coverage ≥ 80% ✓

# 3. E2E tests pass
npm run test:e2e
# [ ] Passed ✓

# 4. TypeScript validation
npm run type-check
# [ ] No errors ✓

# 5. Linting
npm run lint
# [ ] No errors ✓

# 6. Production build
npm run build
# [ ] Build succeeds ✓
```

**Manual Verification:**
- [ ] Feature works in browser
- [ ] All user interactions work correctly
- [ ] Error messages display properly
- [ ] Loading states work
- [ ] No console errors or warnings
- [ ] Responsive design works
- [ ] Edge cases handled
- [ ] Tested in multiple scenarios

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Proper ARIA labels
- [ ] Focus management

---

### ☐ Step 5: Merge to Main

```bash
# Final verification in feature branch
npm run test && npm run type-check && npm run lint
# [ ] All checks passed ✓

# Commit any final changes
git add .
git commit -m "Final changes for [feature-name]"
git push origin feature/[feature-name]

# Merge to main
git checkout main
git pull origin main          # Get latest main
git merge feature/[feature-name]
git push origin main

# Delete feature branch
git branch -d feature/[feature-name]
git push origin --delete feature/[feature-name]  # Delete remote branch
```

**Verify:**
- [ ] All changes committed
- [ ] Merged to main successfully
- [ ] Pushed to remote
- [ ] Feature branch deleted

---

### ☐ Step 6: Run ALL Tests in Main Branch

**⚠️ CRITICAL: Verify main branch stability**

```bash
git checkout main
```

**Run complete test suite:**

```bash
# 1. All unit & integration tests
npm run test
# [ ] All tests pass ✓
# [ ] No new failures ✓

# 2. E2E tests
npm run test:e2e
# [ ] All E2E tests pass ✓

# 3. Coverage check
npm run test:coverage
# [ ] Coverage ≥ 80% ✓
# [ ] Coverage hasn't dropped ✓

# 4. TypeScript validation
npm run type-check
# [ ] No TypeScript errors ✓

# 5. Linting
npm run lint
# [ ] No linting errors ✓

# 6. Production build
npm run build
# [ ] Build succeeds ✓
# [ ] No build warnings ✓
```

**Manual Verification in Main:**
- [ ] Feature works correctly in main branch
- [ ] No regressions in existing features
- [ ] Application starts without errors
- [ ] Database migrations (if any) applied
- [ ] No console errors

**If ANY tests fail:**
- [ ] ⚠️ STOP - Do not proceed to next feature
- [ ] Investigate failure cause
- [ ] Fix immediately in main branch
- [ ] Re-run all tests
- [ ] Only proceed when all tests pass

---

### ☐ Step 7: Update Documentation and Move to Next Feature

**📝 MANDATORY Documentation Updates:**
- [ ] Update **STATUS.md**:
  - [ ] Mark feature as complete in "Completed Features" section
  - [ ] Add detailed completion entry in "Recent Updates" with timestamp
  - [ ] Update "Current Focus" to reflect completion
  - [ ] Mark feature checkbox in "Pending Features" as done
- [ ] Update **README.md**:
  - [ ] Mark feature as complete `[x]` in "Feature Roadmap" section
  - [ ] Update feature status from `[ ]` to `[x]`
  - [ ] Ensure roadmap reflects current state
- [ ] Add comments to complex code (if needed)
- [ ] Update CLAUDE.md if workflow changed
- [ ] Update API documentation (if applicable)

**Commit Documentation:**
```bash
git add README.md STATUS.md
git commit -m "docs: Update documentation after [feature-name] completion"
git push origin main
```

**Final Verification:**
- [ ] Feature fully implemented ✓
- [ ] All tests passing in main branch ✓
- [ ] No regressions detected ✓
- [ ] Coverage ≥ 80% maintained ✓
- [ ] Build succeeds ✓
- [ ] Feature manually verified ✓
- [ ] Documentation updated ✓

**Ready for Next Feature:**
- [ ] Main branch is stable and deployable
- [ ] All quality gates passed
- [ ] Team notified (if applicable)

---

## Notes & Issues

**Challenges encountered:**
-
-
-

**Technical debt created (if any):**
-
-

**Follow-up tasks:**
-
-

---

## Sign-off

**Feature completed by:** _________________

**Date:** _________________

**Review notes:**
-
-

---

## Quick Reference

### Branch Naming Convention
- `feature/authentication-flow`
- `feature/note-capture`
- `feature/semantic-search`

### Test Commands
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # E2E tests
npm run test:e2e:ui       # E2E with UI
```

### Quality Commands
```bash
npm run type-check        # TypeScript validation
npm run lint              # Linting
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code
npm run build             # Production build
```

### Coverage Requirements
- Overall: ≥ 80%
- Business Logic: ≥ 90%
- API Routes: ≥ 85%
- Components: ≥ 80%

---

**Remember:** Main branch must ALWAYS be stable and deployable!
