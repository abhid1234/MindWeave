'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, embeddings } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isNeo4jConfigured } from '@/lib/neo4j/client';
import {
  getFullGraph as neo4jGetFullGraph,
  getNodeNeighborhood as neo4jGetNodeNeighborhood,
  getShortestPath as neo4jGetShortestPath,
} from '@/lib/neo4j/queries';

export type GraphNode = {
  id: string;
  title: string;
  type: 'note' | 'link' | 'file';
  tags: string[];
  community?: number;
  pageRank?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  similarity: number;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphResult = {
  success: boolean;
  data?: GraphData;
  message?: string;
};

export async function getContentGraphAction(
  minSimilarity = 0.5,
  limit = 50
): Promise<GraphResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getContentGraph',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const userId = session.user.id;

    // Try Neo4j first if configured
    if (isNeo4jConfigured()) {
      try {
        const neo4jData = await neo4jGetFullGraph(userId, minSimilarity, limit * 4);
        if (neo4jData && neo4jData.nodes.length > 0) {
          return {
            success: true,
            data: {
              nodes: neo4jData.nodes.map((n) => ({
                id: n.id,
                title: n.title,
                type: n.type as 'note' | 'link' | 'file',
                tags: n.tags,
              })),
              edges: neo4jData.edges,
            },
          };
        }
      } catch (error) {
        console.error('Neo4j graph query failed, falling back to pgvector:', error);
      }
    }

    // pgvector fallback (existing logic)
    const safeLimit = Math.min(Math.max(limit, 5), 100);

    const contentItems = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        tags: content.tags,
      })
      .from(content)
      .where(eq(content.userId, userId))
      .orderBy(desc(content.createdAt))
      .limit(safeLimit);

    if (contentItems.length === 0) {
      return { success: true, data: { nodes: [], edges: [] } };
    }

    const edgeResults = await db.execute(sql`
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
        AND 1 - (e1.embedding <=> e2.embedding) >= ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT 200
    `);

    const edges: GraphEdge[] = (
      edgeResults as unknown as Array<{
        source: string;
        target: string;
        similarity: number;
      }>
    ).map((row) => ({
      source: row.source,
      target: row.target,
      similarity: Number.isFinite(Number(row.similarity))
        ? Number(row.similarity)
        : 0,
    }));

    const connectedIds = new Set<string>();
    for (const edge of edges) {
      connectedIds.add(edge.source);
      connectedIds.add(edge.target);
    }

    const nodes: GraphNode[] = contentItems
      .filter((item) => connectedIds.has(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type as 'note' | 'link' | 'file',
        tags: item.tags ?? [],
      }));

    return { success: true, data: { nodes, edges } };
  } catch (error) {
    console.error('Error getting content graph:', error);
    return { success: false, message: 'Failed to load graph data' };
  }
}

export async function getNodeNeighborhoodAction(
  nodeId: string,
  hops = 2
): Promise<GraphResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getNodeNeighborhood',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!isNeo4jConfigured()) {
      return { success: false, message: 'Neo4j not configured' };
    }

    const neo4jData = await neo4jGetNodeNeighborhood(nodeId, session.user.id, hops);
    if (!neo4jData) {
      return { success: false, message: 'Failed to fetch neighborhood' };
    }

    return {
      success: true,
      data: {
        nodes: neo4jData.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          type: n.type as 'note' | 'link' | 'file',
          tags: n.tags,
        })),
        edges: neo4jData.edges,
      },
    };
  } catch (error) {
    console.error('Error getting node neighborhood:', error);
    return { success: false, message: 'Failed to load neighborhood' };
  }
}

export async function getShortestPathAction(
  sourceId: string,
  targetId: string
): Promise<GraphResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getShortestPath',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!isNeo4jConfigured()) {
      return { success: false, message: 'Neo4j not configured' };
    }

    const neo4jData = await neo4jGetShortestPath(sourceId, targetId, session.user.id);
    if (!neo4jData) {
      return { success: false, message: 'Failed to find shortest path' };
    }

    return {
      success: true,
      data: {
        nodes: neo4jData.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          type: n.type as 'note' | 'link' | 'file',
          tags: n.tags,
        })),
        edges: neo4jData.edges,
      },
    };
  } catch (error) {
    console.error('Error getting shortest path:', error);
    return { success: false, message: 'Failed to find path' };
  }
}
