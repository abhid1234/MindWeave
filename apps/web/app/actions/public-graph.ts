'use server';

import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, embeddings, publicGraphs } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import pagerank from 'graphology-metrics/centrality/pagerank';
import type {
  PublicGraphData,
  PublicGraphSettings,
  PublicGraphResult,
  PublicGraphStats,
  GeneratePublicGraphResult,
} from '@/types/public-graph';

/**
 * Generate a public shareable graph from the user's knowledge graph
 */
export async function generatePublicGraphAction(
  title: string,
  description: string,
  settings?: PublicGraphSettings
): Promise<GeneratePublicGraphResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Rate limit (reuse serverAction preset)
    const rateCheck = checkServerActionRateLimit(userId, 'publicGraph', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Get content nodes (strip body/userId for privacy)
    const nodes = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        tags: content.tags,
        autoTags: content.autoTags,
      })
      .from(content)
      .where(eq(content.userId, userId));

    if (nodes.length === 0) {
      return { success: false, message: 'No content to create a graph from' };
    }

    // Get edges (content pairs with similarity > 0.3)
    const edgeResult = await db.execute<{
      source: string;
      target: string;
      weight: string;
    }>(sql`
      SELECT
        e1.content_id as source,
        e2.content_id as target,
        1 - (e1.embedding <=> e2.embedding) as weight
      FROM ${embeddings} e1
      JOIN ${embeddings} e2 ON e2.content_id > e1.content_id
      JOIN ${content} c1 ON c1.id = e1.content_id AND c1.user_id = ${userId}
      JOIN ${content} c2 ON c2.id = e2.content_id AND c2.user_id = ${userId}
      WHERE 1 - (e1.embedding <=> e2.embedding) > 0.3
      ORDER BY weight DESC
      LIMIT 500
    `);

    const edgeRows = edgeResult as unknown as { source: string; target: string; weight: string }[];

    // Build graphology graph for analytics
    const graph = new Graph({ type: 'undirected' });

    const allTags: string[] = [];

    const rawNodes = nodes.map((n) => {
      const combinedTags = [...n.tags, ...n.autoTags];
      allTags.push(...combinedTags);
      return {
        id: n.id,
        title: n.title,
        type: n.type,
        tags: combinedTags,
      };
    });

    for (const node of rawNodes) {
      graph.addNode(node.id, { label: node.title, type: node.type });
    }

    const rawEdges = edgeRows.map((e) => ({
      source: e.source,
      target: e.target,
      weight: parseFloat(e.weight),
    }));

    for (const edge of rawEdges) {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        try {
          graph.addEdge(edge.source, edge.target, { weight: edge.weight });
        } catch {
          // Skip duplicate edges
        }
      }
    }

    // Run community detection
    let communities: Record<string, number> = {};
    try {
      if (graph.size > 0) {
        communities = louvain(graph);
      }
    } catch {
      for (const nodeId of graph.nodes()) {
        communities[nodeId] = 0;
      }
    }

    // Run PageRank
    let ranks: Record<string, number> = {};
    try {
      if (graph.size > 0) {
        ranks = pagerank(graph);
      }
    } catch {
      for (const nodeId of graph.nodes()) {
        ranks[nodeId] = 1 / graph.order;
      }
    }

    // Compute stats
    const communitySet = new Set(Object.values(communities));
    const tagFrequency: Record<string, number> = {};
    for (const tag of allTags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    }
    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    const stats: PublicGraphStats = {
      nodeCount: rawNodes.length,
      edgeCount: rawEdges.length,
      communityCount: communitySet.size,
      topTags,
    };

    // Enrich nodes with community and pageRank
    const enrichedNodes = rawNodes.map((node) => ({
      ...node,
      community: communities[node.id] ?? 0,
      pageRank: ranks[node.id] ?? 0,
    }));

    const graphData: PublicGraphData = {
      nodes: enrichedNodes,
      edges: rawEdges,
      stats,
    };

    const graphId = crypto.randomBytes(16).toString('hex');

    await db.insert(publicGraphs).values({
      userId,
      graphId,
      title,
      description: description || null,
      graphData,
      settings: settings || null,
    });

    return { success: true, data: { graphId } };
  } catch (error) {
    console.error('Error generating public graph:', error);
    return { success: false, message: 'Failed to create public graph' };
  }
}

/**
 * Get a public graph by its share ID (no auth required)
 */
export async function getPublicGraphAction(graphId: string): Promise<PublicGraphResult> {
  try {
    const result = await db.query.publicGraphs.findFirst({
      where: (pg, { eq }) => eq(pg.graphId, graphId),
    });

    if (!result) {
      return { success: false, message: 'Graph not found' };
    }

    return {
      success: true,
      data: {
        graphId: result.graphId,
        title: result.title,
        description: result.description,
        graphData: result.graphData as PublicGraphData,
        settings: result.settings as PublicGraphSettings | null,
        createdAt: result.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching public graph:', error);
    return { success: false, message: 'Failed to load graph' };
  }
}
