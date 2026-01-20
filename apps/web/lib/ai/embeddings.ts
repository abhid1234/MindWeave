import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/client';
import { embeddings, content } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Gemini Embedding Configuration
 *
 * Using Google's Gemini embedding model for semantic search
 * - Model: text-embedding-004
 * - Dimensions: 768
 * - Cost: Free tier available, then $0.025 per 1M tokens
 * - Setup: Add GOOGLE_AI_API_KEY to .env.local
 */

if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn('GOOGLE_AI_API_KEY is not set. Embedding features will be disabled.');
}

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

// Configuration for Gemini embeddings
export const EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-004',
  dimensions: 768,
};

/**
 * Generate embedding for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    console.warn('Gemini AI not configured. Skipping embedding generation.');
    return new Array(EMBEDDING_CONFIG.dimensions).fill(0);
  }

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_CONFIG.model });

    const result = await model.embedContent(text);
    const embedding = result.embedding;

    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    // Return zero vector as fallback
    return new Array(EMBEDDING_CONFIG.dimensions).fill(0);
  }
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
      .slice(0, 10000); // Gemini can handle longer context

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
