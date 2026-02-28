'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, embeddings, connections } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateConnectionInsight } from '@/lib/ai/gemini';
import type { ConnectionResult, ConnectionsActionResult } from '@/types/connections';

/**
 * Get cross-domain content connections for the current user
 * Finds content pairs with moderate similarity (0.3-0.6) and no overlapping tags
 */
export async function getConnectionsAction(limit = 5): Promise<ConnectionsActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Rate limit
    const rateCheck = checkServerActionRateLimit(userId, 'connectionGeneration', RATE_LIMITS.connectionGeneration);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Check for existing cached connections (less than 24h old)
    const existingConnections = await db.query.connections.findMany({
      where: (conn, { eq, gte, and }) =>
        and(
          eq(conn.userId, userId),
          gte(conn.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        ),
      orderBy: (conn, { desc }) => [desc(conn.createdAt)],
      limit,
    });

    if (existingConnections.length >= limit) {
      // Fetch content details for existing connections
      const results: ConnectionResult[] = [];
      for (const conn of existingConnections.slice(0, limit)) {
        const [contentA, contentB] = await Promise.all([
          db.query.content.findFirst({ where: (c, { eq }) => eq(c.id, conn.contentIdA) }),
          db.query.content.findFirst({ where: (c, { eq }) => eq(c.id, conn.contentIdB) }),
        ]);
        if (contentA && contentB) {
          results.push({
            id: conn.id,
            contentA: { id: contentA.id, title: contentA.title, type: contentA.type, tags: [...contentA.tags, ...contentA.autoTags] },
            contentB: { id: contentB.id, title: contentB.title, type: contentB.type, tags: [...contentB.tags, ...contentB.autoTags] },
            insight: conn.insight,
            similarity: conn.similarity,
            tagGroupA: conn.tagGroupA,
            tagGroupB: conn.tagGroupB,
          });
        }
      }
      return { success: true, data: results };
    }

    // Find pairs with moderate similarity and no overlapping tags
    const pairs = await db.execute<{
      id_a: string;
      title_a: string;
      type_a: string;
      tags_a: string[];
      body_a: string | null;
      id_b: string;
      title_b: string;
      type_b: string;
      tags_b: string[];
      body_b: string | null;
      similarity: string;
    }>(sql`
      SELECT
        c1.id as id_a, c1.title as title_a, c1.type as type_a,
        c1.tags || c1.auto_tags as tags_a, c1.body as body_a,
        c2.id as id_b, c2.title as title_b, c2.type as type_b,
        c2.tags || c2.auto_tags as tags_b, c2.body as body_b,
        1 - (e1.embedding <=> e2.embedding) as similarity
      FROM ${content} c1
      JOIN ${embeddings} e1 ON e1.content_id = c1.id
      JOIN ${content} c2 ON c2.user_id = c1.user_id AND c2.id > c1.id
      JOIN ${embeddings} e2 ON e2.content_id = c2.id
      WHERE c1.user_id = ${userId}
        AND 1 - (e1.embedding <=> e2.embedding) BETWEEN 0.3 AND 0.6
        AND NOT (c1.tags || c1.auto_tags) && (c2.tags || c2.auto_tags)
      ORDER BY RANDOM()
      LIMIT ${limit}
    `);

    const rows = pairs as unknown as Array<{
      id_a: string; title_a: string; type_a: string; tags_a: string[]; body_a: string | null;
      id_b: string; title_b: string; type_b: string; tags_b: string[]; body_b: string | null;
      similarity: string;
    }>;

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    // Generate insights for each pair
    const results: ConnectionResult[] = [];
    for (const row of rows) {
      const similarity = parseFloat(row.similarity);

      const insight = await generateConnectionInsight(
        { title: row.title_a, body: row.body_a || undefined, tags: row.tags_a || [] },
        { title: row.title_b, body: row.body_b || undefined, tags: row.tags_b || [] },
        similarity
      );

      // Cache in DB
      const [inserted] = await db.insert(connections).values({
        userId,
        contentIdA: row.id_a,
        contentIdB: row.id_b,
        insight,
        similarity: Math.round(similarity * 100),
        tagGroupA: row.tags_a || [],
        tagGroupB: row.tags_b || [],
      }).returning();

      results.push({
        id: inserted.id,
        contentA: { id: row.id_a, title: row.title_a, type: row.type_a, tags: row.tags_a || [] },
        contentB: { id: row.id_b, title: row.title_b, type: row.type_b, tags: row.tags_b || [] },
        insight,
        similarity: Math.round(similarity * 100),
        tagGroupA: row.tags_a || [],
        tagGroupB: row.tags_b || [],
      });
    }

    return { success: true, data: results };
  } catch (error) {
    console.error('Error getting connections:', error);
    return { success: false, message: 'Failed to find connections' };
  }
}
