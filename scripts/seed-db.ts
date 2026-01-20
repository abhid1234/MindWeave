/**
 * Database Seeding Script
 *
 * This script seeds the database with sample data for development and testing.
 *
 * Usage:
 *   tsx scripts/seed-db.ts
 *
 * Make sure to install tsx first:
 *   pnpm add -D tsx
 */

import { db } from '../apps/web/lib/db/client';
import { users, content } from '../apps/web/lib/db/schema';
import { eq } from 'drizzle-orm';

const SEED_USER_EMAIL = 'dev@mindweave.local';

async function main() {
  console.log('🌱 Seeding database...');

  // Check if seed user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, SEED_USER_EMAIL),
  });

  let userId: string;

  if (existingUser) {
    console.log('✅ Seed user already exists');
    userId = existingUser.id;
  } else {
    // Create seed user
    const [newUser] = await db
      .insert(users)
      .values({
        name: 'Dev User',
        email: SEED_USER_EMAIL,
        emailVerified: new Date(),
      })
      .returning();

    userId = newUser.id;
    console.log('✅ Created seed user');
  }

  // Sample content
  const sampleContent = [
    {
      type: 'note' as const,
      title: 'Welcome to Mindweave!',
      body: 'This is your first note. Mindweave helps you capture, organize, and rediscover your ideas using AI.',
      tags: ['welcome', 'getting-started'],
    },
    {
      type: 'note' as const,
      title: 'Project Ideas',
      body: `1. Build a personal dashboard for tracking habits
2. Create a recipe organizer with AI-powered meal planning
3. Develop a reading list manager with notes and highlights`,
      tags: ['ideas', 'projects'],
    },
    {
      type: 'link' as const,
      title: 'Next.js Documentation',
      url: 'https://nextjs.org/docs',
      body: 'The official Next.js documentation - great resource for learning React and server-side rendering',
      tags: ['nextjs', 'documentation', 'react'],
    },
    {
      type: 'link' as const,
      title: 'Claude AI',
      url: 'https://www.anthropic.com/claude',
      body: 'Claude is an AI assistant created by Anthropic. Mindweave uses Claude for auto-tagging and Q&A.',
      tags: ['ai', 'claude', 'anthropic'],
    },
    {
      type: 'note' as const,
      title: 'Meeting Notes - Product Planning',
      body: `Discussed roadmap for Q1 2026:
- Launch MVP with core features
- Gather user feedback
- Iterate on UX based on usage patterns
- Add collaborative features in Q2`,
      tags: ['meetings', 'planning', 'product'],
    },
    {
      type: 'note' as const,
      title: 'Learning TypeScript',
      body: `Key concepts to master:
- Type inference
- Generics
- Union and intersection types
- Utility types (Partial, Pick, Omit)
- Conditional types`,
      tags: ['typescript', 'learning', 'programming'],
    },
    {
      type: 'link' as const,
      title: 'pgvector - Vector Database Extension',
      url: 'https://github.com/pgvector/pgvector',
      body: 'Open-source vector similarity search for PostgreSQL. Powers semantic search in Mindweave.',
      tags: ['database', 'postgresql', 'vector-search'],
    },
    {
      type: 'note' as const,
      title: 'Book Summary: Atomic Habits',
      body: `Key takeaways:
- Make good habits obvious, attractive, easy, and satisfying
- The compound effect of small improvements
- Environment design is crucial
- Focus on systems, not goals`,
      tags: ['books', 'productivity', 'habits'],
    },
  ];

  // Check if content already exists
  const existingContent = await db.query.content.findFirst({
    where: eq(content.userId, userId),
  });

  if (existingContent) {
    console.log('⚠️  Content already exists for seed user. Skipping content creation.');
    console.log('   Delete existing content first if you want to re-seed.');
  } else {
    // Insert sample content
    for (const item of sampleContent) {
      await db.insert(content).values({
        userId,
        type: item.type,
        title: item.title,
        body: item.body,
        url: 'url' in item ? item.url : null,
        tags: item.tags,
        autoTags: [], // Will be populated when AI tagging feature is implemented
      });
    }

    console.log(`✅ Created ${sampleContent.length} sample content items`);
  }

  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('Seed user credentials:');
  console.log(`  Email: ${SEED_USER_EMAIL}`);
  console.log('  (Use this email to login via OAuth in development)');
  console.log('');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
