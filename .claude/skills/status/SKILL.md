---
name: status
description: Update STATUS.md after a change or deployment
disable-model-invocation: true
---

Update the STATUS.md file in the project root to reflect recent changes.

Steps:
1. Read the current STATUS.md (first ~80 lines to see the latest enhancement section).
2. Check recent git commits with `git log --oneline -10` to understand what changed.
3. Update STATUS.md:
   - If there's a new deployment, add it as the **Latest Enhancement** and demote the previous latest to **Previous Enhancement**.
   - Include: deploy image tag, bullet points of what changed, test count.
   - Keep the date as the actual current date.
4. Commit the update: `git add STATUS.md && git commit -m "docs: Update STATUS.md with <brief description>"`
5. Push: `git push origin main`

If $ARGUMENTS is provided, use it as context for what to include in the update.
