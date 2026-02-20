import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db/client';
import { embeddings, content } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Gemini Embedding Configuration
 *
 * Using Google's Gemini embedding model for semantic search
 * - Model: gemini-embedding-001
 * - Dimensions: 768 (reduced from 3072 via outputDimensionality)
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
  model: 'gemini-embedding-001',
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

    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      outputDimensionality: EMBEDDING_CONFIG.dimensions,
    } as Parameters<typeof model.embedContent>[0]);
    const embedding = result.embedding;

    return embedding.values.slice(0, EMBEDDING_CONFIG.dimensions);
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

export type SearchResult = {
  id: string;
  title: string;
  body: string | null;
  type: 'note' | 'link' | 'file';
  tags: string[];
  autoTags: string[];
  url: string | null;
  createdAt: Date;
  similarity: number;
};

/**
 * Search for similar content using vector similarity
 */
export async function searchSimilarContent(
  query: string,
  userId: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Check if embedding generation failed (returns zero vector)
    const isZeroVector = queryEmbedding.every(v => v === 0);
    if (isZeroVector) {
      console.warn('Query embedding generation failed (zero vector) - falling back to recent content');
      return fetchRecentContent(userId, limit);
    }

    // Convert embedding to pgvector string format: '[1,2,3,...]'
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Perform vector similarity search using pgvector
    // Using cosine distance (1 - cosine similarity)
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.title,
        c.body,
        c.type,
        c.tags,
        c.auto_tags as "autoTags",
        c.url,
        c.created_at as "createdAt",
        1 - (e.embedding <=> ${vectorString}::vector) as similarity
      FROM ${content} c
      INNER JOIN ${embeddings} e ON c.id = e.content_id
      WHERE c.user_id = ${userId}
        AND (e.embedding <=> ${vectorString}::vector) <> 'NaN'::float8
      ORDER BY e.embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `);

    const searchResults = (results as unknown as Record<string, unknown>[]).map((row) => ({
      ...row,
      similarity: Number.isFinite(row.similarity as number) ? Number(row.similarity) : 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
    })) as SearchResult[];

    // If semantic search returned nothing (e.g. all stored embeddings are zero vectors),
    // fall back to recent content so broad queries like "Summarize all my notes" still work
    if (searchResults.length === 0) {
      console.warn('Semantic search returned no results - falling back to recent content');
      return fetchRecentContent(userId, limit);
    }

    return searchResults;
  } catch (error) {
    console.error('Error searching similar content:', error);
    return [];
  }
}

/**
 * Fetch recent content as a fallback when semantic search is unavailable
 */
async function fetchRecentContent(
  userId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.title,
        c.body,
        c.type,
        c.tags,
        c.auto_tags as "autoTags",
        c.url,
        c.created_at as "createdAt",
        0 as similarity
      FROM ${content} c
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `);

    return (results as unknown as Record<string, unknown>[]).map((row) => ({
      ...row,
      similarity: 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
    })) as SearchResult[];
  } catch (error) {
    console.error('Error fetching recent content:', error);
    return [];
  }
}

export type Recommendation = {
  id: string;
  title: string;
  body: string | null;
  type: 'note' | 'link' | 'file';
  tags: string[];
  autoTags: string[];
  url: string | null;
  createdAt: Date;
  similarity: number;
};

/**
 * Get content recommendations based on a content item
 * Only returns content from the same user for security
 */
export async function getRecommendations(
  contentId: string,
  userId: string,
  limit: number = 5,
  minSimilarity: number = 0.5
): Promise<Recommendation[]> {
  try {
    // Get the embedding for the content
    const embedding = await db.query.embeddings.findFirst({
      where: eq(embeddings.contentId, contentId),
    });

    if (!embedding) {
      return [];
    }

    // Convert embedding to pgvector string format
    const vectorString = `[${embedding.embedding.join(',')}]`;

    // Find similar content (filtered by userId for security)
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.title,
        c.body,
        c.type,
        c.tags,
        c.auto_tags as "autoTags",
        c.url,
        c.created_at as "createdAt",
        1 - (e.embedding <=> ${vectorString}::vector) as similarity
      FROM ${content} c
      INNER JOIN ${embeddings} e ON c.id = e.content_id
      WHERE c.id != ${contentId}
        AND c.user_id = ${userId}
        AND (e.embedding <=> ${vectorString}::vector) <> 'NaN'::float8
        AND 1 - (e.embedding <=> ${vectorString}::vector) >= ${minSimilarity}
      ORDER BY e.embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `);

    return (results as unknown as Record<string, unknown>[]).map((row) => ({
      ...row,
      similarity: Number.isFinite(row.similarity as number) ? Number(row.similarity) : 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
    })) as Recommendation[];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}
