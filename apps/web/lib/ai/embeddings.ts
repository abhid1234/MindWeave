import { db } from '@/lib/db/client';
import { embeddings, content } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

/**
 * TODO: Choose and configure an embedding service
 *
 * Options:
 * 1. OpenAI (recommended) - text-embedding-3-small
 *    - Cost: $0.02 per 1M tokens
 *    - Dimensions: 1536
 *    - Setup: Add OPENAI_API_KEY to .env.local
 *
 * 2. Cohere - embed-english-v3.0
 *    - Free tier available
 *    - Dimensions: 1024
 *    - Setup: Add COHERE_API_KEY to .env.local
 *
 * 3. HuggingFace - sentence-transformers
 *    - Free (self-hosted)
 *    - Various models available
 *    - Requires more setup
 */

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

// Default configuration for OpenAI
export const EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

/**
 * Generate embedding for text using configured service
 *
 * PLACEHOLDER: Implement based on chosen embedding service
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: Implement based on chosen service
  // Example for OpenAI:
  /*
  import OpenAI from 'openai';

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
  */

  // For now, return a placeholder
  console.warn('Embedding generation not implemented yet. Please configure an embedding service.');
  return new Array(EMBEDDING_CONFIG.dimensions).fill(0);
}

/**
 * Create or update embedding for a content item
 */
export async function upsertContentEmbedding(contentId: string): Promise<void> {
  try {
    // Get the content
    const contentItem = await db.query.content.findFirst({
      where: eq(content.id, contentId),
    });

    if (!contentItem) {
      throw new Error('Content not found');
    }

    // Generate text to embed
    const textToEmbed = [
      contentItem.title,
      contentItem.body || '',
      contentItem.tags.join(' '),
      contentItem.autoTags.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 8000); // Limit length

    // Generate embedding
    const embeddingVector = await generateEmbedding(textToEmbed);

    // Check if embedding already exists
    const existing = await db.query.embeddings.findFirst({
      where: eq(embeddings.contentId, contentId),
    });

    if (existing) {
      // Update existing
      await db
        .update(embeddings)
        .set({
          embedding: embeddingVector,
          model: EMBEDDING_CONFIG.model,
        })
        .where(eq(embeddings.contentId, contentId));
    } else {
      // Insert new
      await db.insert(embeddings).values({
        contentId,
        embedding: embeddingVector,
        model: EMBEDDING_CONFIG.model,
      });
    }
  } catch (error) {
    console.error('Error upserting embedding:', error);
    throw error;
  }
}

/**
 * Search for similar content using vector similarity
 */
export async function searchSimilarContent(
  query: string,
  userId: string,
  limit: number = 10
): Promise<Array<{ id: string; title: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using pgvector
    // Using cosine distance (1 - cosine similarity)
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.title,
        c.body,
        c.tags,
        1 - (e.embedding <=> ${sql`ARRAY[${sql.join(queryEmbedding.map((v) => sql`${v}`), sql`, `)}]::vector`}) as similarity
      FROM ${content} c
      INNER JOIN ${embeddings} e ON c.id = e.content_id
      WHERE c.user_id = ${userId}
      ORDER BY e.embedding <=> ${sql`ARRAY[${sql.join(queryEmbedding.map((v) => sql`${v}`), sql`, `)}]::vector`}
      LIMIT ${limit}
    `);

    return results.rows as any;
  } catch (error) {
    console.error('Error searching similar content:', error);
    return [];
  }
}

/**
 * Get content recommendations based on a content item
 */
export async function getRecommendations(
  contentId: string,
  limit: number = 5
): Promise<Array<{ id: string; title: string; similarity: number }>> {
  try {
    // Get the embedding for the content
    const embedding = await db.query.embeddings.findFirst({
      where: eq(embeddings.contentId, contentId),
    });

    if (!embedding) {
      return [];
    }

    // Find similar content
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.title,
        1 - (e.embedding <=> ${embedding.embedding}) as similarity
      FROM ${content} c
      INNER JOIN ${embeddings} e ON c.id = e.content_id
      WHERE c.id != ${contentId}
      ORDER BY e.embedding <=> ${embedding.embedding}
      LIMIT ${limit}
    `);

    return results.rows as any;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}
