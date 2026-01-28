import { db } from '@/lib/db/client';
import { users, content, embeddings, accounts, sessions, devices } from '@/lib/db/schema';

/**
 * Clean all data from the test database
 */
export async function cleanDatabase() {
  await db.delete(embeddings);
  await db.delete(content);
  await db.delete(devices);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(users);
}

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<typeof users.$inferInsert>) {
  const [user] = await db
    .insert(users)
    .values({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      onboardingCompleted: true,
      ...data,
    })
    .returning();

  return user;
}

/**
 * Create test content
 */
export async function createTestContent(
  userId: string,
  data?: Partial<typeof content.$inferInsert>
) {
  const [item] = await db
    .insert(content)
    .values({
      userId,
      type: 'note',
      title: 'Test Note',
      body: 'This is a test note',
      tags: [],
      autoTags: [],
      ...data,
    })
    .returning();

  return item;
}

/**
 * Create test embedding
 */
export async function createTestEmbedding(
  contentId: string,
  embeddingVector?: number[]
) {
  const defaultEmbedding = Array(768).fill(0.1); // 768 dimensions for Gemini

  const [embedding] = await db
    .insert(embeddings)
    .values({
      contentId,
      embedding: embeddingVector || defaultEmbedding,
      model: 'text-embedding-004',
    })
    .returning();

  return embedding;
}

/**
 * Create test device for push notifications
 */
export async function createTestDevice(
  userId: string,
  data?: Partial<typeof devices.$inferInsert>
) {
  const [device] = await db
    .insert(devices)
    .values({
      userId,
      token: `test-token-${Date.now()}`,
      platform: 'android',
      isActive: true,
      ...data,
    })
    .returning();

  return device;
}
