import { db } from '@/lib/db/client';
import { content, embeddings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getNeo4jSession, isNeo4jConfigured } from './client';

/**
 * Sync a content item (and its tags) to Neo4j.
 * Called after content create, update, or tag edit.
 */
export async function syncContentToNeo4j(contentId: string): Promise<void> {
  if (!isNeo4jConfigured()) return;

  const item = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });
  if (!item) return;

  const session = getNeo4jSession();
  if (!session) return;

  try {
    // Merge the Content node
    await session.run(
      `MERGE (c:Content {id: $id})
       SET c.title = $title, c.type = $type, c.userId = $userId`,
      { id: item.id, title: item.title, type: item.type, userId: item.userId }
    );

    // Remove old TAGGED_WITH edges, then recreate
    await session.run(
      `MATCH (c:Content {id: $id})-[r:TAGGED_WITH]->() DELETE r`,
      { id: item.id }
    );

    const allTags = [...(item.tags ?? []), ...(item.autoTags ?? [])];
    const uniqueTags = [...new Set(allTags)];

    if (uniqueTags.length > 0) {
      await session.run(
        `UNWIND $tags AS tagName
         MERGE (t:Tag {name: tagName})
         WITH t
         MATCH (c:Content {id: $id})
         MERGE (c)-[:TAGGED_WITH]->(t)`,
        { tags: uniqueTags, id: item.id }
      );
    }
  } finally {
    await session.close();
  }
}

/**
 * Delete a content node and all its relationships from Neo4j.
 */
export async function deleteContentFromNeo4j(contentId: string): Promise<void> {
  if (!isNeo4jConfigured()) return;

  const session = getNeo4jSession();
  if (!session) return;

  try {
    await session.run(
      `MATCH (c:Content {id: $id}) DETACH DELETE c`,
      { id: contentId }
    );
  } finally {
    await session.close();
  }
}

/**
 * After embedding upsert, query pgvector for similar items
 * and create SIMILAR_TO edges in Neo4j.
 */
export async function syncSimilarityEdges(
  contentId: string,
  userId: string
): Promise<void> {
  if (!isNeo4jConfigured()) return;

  // Get the embedding for this content
  const embeddingRow = await db.query.embeddings.findFirst({
    where: eq(embeddings.contentId, contentId),
  });
  if (!embeddingRow) return;

  const vectorString = `[${embeddingRow.embedding.join(',')}]`;

  // Find top 50 similar items from pgvector
  const similarItems = await db.execute(sql`
    SELECT
      e.content_id AS "contentId",
      1 - (e.embedding <=> ${vectorString}::vector) AS similarity
    FROM embeddings e
    INNER JOIN content c ON e.content_id = c.id
    WHERE c.user_id = ${userId}
      AND e.content_id != ${contentId}
      AND (e.embedding <=> ${vectorString}::vector) <> 'NaN'::float8
      AND 1 - (e.embedding <=> ${vectorString}::vector) >= 0.3
    ORDER BY e.embedding <=> ${vectorString}::vector
    LIMIT 50
  `);

  const rows = similarItems as unknown as Array<{
    contentId: string;
    similarity: number;
  }>;

  if (rows.length === 0) return;

  const session = getNeo4jSession();
  if (!session) return;

  try {
    // Remove old SIMILAR_TO edges for this content
    await session.run(
      `MATCH (c:Content {id: $id})-[r:SIMILAR_TO]-() DELETE r`,
      { id: contentId }
    );

    // Create new SIMILAR_TO edges
    await session.run(
      `UNWIND $edges AS edge
       MATCH (c1:Content {id: $sourceId})
       MATCH (c2:Content {id: edge.targetId})
       MERGE (c1)-[r:SIMILAR_TO]-(c2)
       SET r.score = edge.score`,
      {
        sourceId: contentId,
        edges: rows.map((r) => ({
          targetId: r.contentId,
          score: Number(r.similarity),
        })),
      }
    );
  } finally {
    await session.close();
  }
}

/**
 * Full sync: clear the user's graph and rebuild from PostgreSQL.
 * Returns counts for API response.
 */
export async function fullSyncUserGraph(
  userId: string
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  if (!isNeo4jConfigured()) {
    return { nodesCreated: 0, edgesCreated: 0 };
  }

  const session = getNeo4jSession();
  if (!session) {
    return { nodesCreated: 0, edgesCreated: 0 };
  }

  try {
    // Clear existing user graph
    await session.run(
      `MATCH (c:Content {userId: $userId}) DETACH DELETE c`,
      { userId }
    );

    // Fetch all user content
    const allContent = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        tags: content.tags,
        autoTags: content.autoTags,
      })
      .from(content)
      .where(eq(content.userId, userId));

    if (allContent.length === 0) {
      return { nodesCreated: 0, edgesCreated: 0 };
    }

    // Batch create content nodes
    await session.run(
      `UNWIND $items AS item
       CREATE (c:Content {id: item.id, title: item.title, type: item.type, userId: $userId})`,
      {
        userId,
        items: allContent.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
        })),
      }
    );

    // Create tag nodes and edges
    const tagEdges: { contentId: string; tag: string }[] = [];
    for (const item of allContent) {
      const allTags = [...new Set([...(item.tags ?? []), ...(item.autoTags ?? [])])];
      for (const tag of allTags) {
        tagEdges.push({ contentId: item.id, tag });
      }
    }

    if (tagEdges.length > 0) {
      await session.run(
        `UNWIND $edges AS edge
         MERGE (t:Tag {name: edge.tag})
         WITH t, edge
         MATCH (c:Content {id: edge.contentId})
         CREATE (c)-[:TAGGED_WITH]->(t)`,
        { edges: tagEdges }
      );
    }

    // Fetch all embeddings and compute similarity edges
    const allEmbeddings = await db.execute(sql`
      SELECT
        e1.content_id AS source,
        e2.content_id AS target,
        1 - (e1.embedding <=> e2.embedding) AS similarity
      FROM embeddings e1
      INNER JOIN embeddings e2 ON e1.content_id < e2.content_id
      INNER JOIN content c1 ON e1.content_id = c1.id
      INNER JOIN content c2 ON e2.content_id = c2.id
      WHERE c1.user_id = ${userId}
        AND c2.user_id = ${userId}
        AND (e1.embedding <=> e2.embedding) <> 'NaN'::float8
        AND 1 - (e1.embedding <=> e2.embedding) >= 0.3
      ORDER BY similarity DESC
      LIMIT 500
    `);

    const similarityRows = allEmbeddings as unknown as Array<{
      source: string;
      target: string;
      similarity: number;
    }>;

    if (similarityRows.length > 0) {
      await session.run(
        `UNWIND $edges AS edge
         MATCH (c1:Content {id: edge.source})
         MATCH (c2:Content {id: edge.target})
         CREATE (c1)-[:SIMILAR_TO {score: edge.score}]-(c2)`,
        {
          edges: similarityRows.map((r) => ({
            source: r.source,
            target: r.target,
            score: Number(r.similarity),
          })),
        }
      );
    }

    return {
      nodesCreated: allContent.length,
      edgesCreated: similarityRows.length + tagEdges.length,
    };
  } finally {
    await session.close();
  }
}
