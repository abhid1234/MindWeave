/**
 * Seed script for TIL posts
 *
 * Usage: cd apps/web && tsx ../../scripts/seed-til.ts
 *
 * Prerequisites:
 * - Database must be running (pnpm docker:up)
 * - At least one user must exist (run seed-db.ts first)
 * - Content items must exist for the user
 */

import { db } from '../apps/web/lib/db/client';
import { users, content, tilPosts } from '../apps/web/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const TIL_SEEDS = [
  {
    title: 'TIL: JavaScript Array.at() supports negative indices',
    body: 'You can use `array.at(-1)` to get the last element of an array instead of `array[array.length - 1]`. Works in all modern browsers since 2022.',
    tags: ['javascript', 'arrays', 'es2022'],
  },
  {
    title: 'TIL: CSS :has() selector enables parent selection',
    body: 'The `:has()` pseudo-class lets you style a parent based on its children. For example, `div:has(> img)` selects divs that contain an img. This was the most requested CSS feature for years!',
    tags: ['css', 'selectors', 'frontend'],
  },
  {
    title: 'TIL: PostgreSQL supports LATERAL joins',
    body: 'LATERAL joins let you reference columns from preceding tables in the FROM clause. Super useful for correlated subqueries that need to run per-row. Think of it like a for-each loop in SQL.',
    tags: ['postgresql', 'sql', 'databases'],
  },
  {
    title: 'TIL: React Server Components can import client components but not vice versa',
    body: 'The "use client" boundary is one-directional. Server components can import and render client components, but client components cannot import server components. You can pass server components as children though!',
    tags: ['react', 'nextjs', 'rsc'],
  },
  {
    title: 'TIL: Git worktrees let you work on multiple branches simultaneously',
    body: 'Instead of stashing changes to switch branches, `git worktree add ../feature-branch feature-branch` creates a separate working directory. Each worktree has its own working tree but shares the same .git directory.',
    tags: ['git', 'productivity', 'workflow'],
  },
  {
    title: 'TIL: TypeScript satisfies operator preserves literal types',
    body: 'The `satisfies` keyword checks that a value matches a type without widening it. `const config = { theme: "dark" } satisfies Config` keeps the literal type "dark" instead of widening to string.',
    tags: ['typescript', 'type-system'],
  },
  {
    title: 'TIL: Docker multi-stage builds can reduce image size by 90%',
    body: 'By using separate build and runtime stages, you can compile your app in one stage with all dev dependencies, then copy only the built artifacts to a minimal runtime image. Went from 1.2GB to 120MB!',
    tags: ['docker', 'devops', 'optimization'],
  },
  {
    title: 'TIL: HTTP 103 Early Hints lets browsers preload resources before the full response',
    body: 'The server can send a 103 status code with Link headers before the final response. The browser starts downloading CSS, fonts, and scripts while the server is still processing the request.',
    tags: ['http', 'performance', 'web'],
  },
  {
    title: 'TIL: Drizzle ORM supports prepared statements for better query performance',
    body: 'You can use `db.query.prepare()` to create reusable prepared statements. PostgreSQL only parses and plans the query once, then re-executes with different parameters. Up to 3x faster for repeated queries.',
    tags: ['drizzle', 'orm', 'postgresql', 'performance'],
  },
  {
    title: 'TIL: AbortController works with fetch, addEventListener, and custom async operations',
    body: 'AbortController is not just for fetch! You can pass its signal to addEventListener for automatic cleanup, and check `signal.aborted` in custom async code. Perfect for React useEffect cleanup.',
    tags: ['javascript', 'async', 'react'],
  },
];

async function seedTils() {
  console.log('Seeding TIL posts...');

  // Get first user
  const [user] = await db.select().from(users).limit(1);
  if (!user) {
    console.error('No users found. Run seed-db.ts first.');
    process.exit(1);
  }

  // Get user's content
  const userContent = await db
    .select()
    .from(content)
    .where(eq(content.userId, user.id))
    .limit(10);

  if (userContent.length === 0) {
    console.error('No content found for user. Run seed-db.ts first.');
    process.exit(1);
  }

  let created = 0;
  for (let i = 0; i < Math.min(TIL_SEEDS.length, userContent.length); i++) {
    const seed = TIL_SEEDS[i];
    const contentItem = userContent[i];

    // Check if TIL already exists for this content
    const [existing] = await db
      .select()
      .from(tilPosts)
      .where(eq(tilPosts.contentId, contentItem.id));

    if (existing) {
      console.log(`  Skipping "${seed.title}" (already exists)`);
      continue;
    }

    // Ensure content is shared
    if (!contentItem.isShared) {
      const shareId = crypto.randomBytes(16).toString('hex');
      await db
        .update(content)
        .set({ isShared: true, shareId })
        .where(eq(content.id, contentItem.id));
    }

    // Create TIL post with some variety in stats
    await db.insert(tilPosts).values({
      contentId: contentItem.id,
      userId: user.id,
      title: seed.title,
      body: seed.body,
      tags: seed.tags,
      upvoteCount: Math.floor(Math.random() * 50),
      viewCount: Math.floor(Math.random() * 200) + 10,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
    });

    created++;
    console.log(`  Created: ${seed.title}`);
  }

  console.log(`\nDone! Created ${created} TIL posts.`);
  process.exit(0);
}

seedTils().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
