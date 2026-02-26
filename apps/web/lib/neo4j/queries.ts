import { withNeo4jSession } from './client';

export type Neo4jNode = {
  id: string;
  title: string;
  type: string;
  tags: string[];
};

export type Neo4jEdge = {
  source: string;
  target: string;
  similarity: number;
};

export type Neo4jGraphData = {
  nodes: Neo4jNode[];
  edges: Neo4jEdge[];
};

/**
 * Get the full knowledge graph for a user from Neo4j.
 */
export async function getFullGraph(
  userId: string,
  minSimilarity = 0.5,
  limit = 100
): Promise<Neo4jGraphData | null> {
  const result = await withNeo4jSession(async (session) => {
    // Get content nodes with SIMILAR_TO edges above threshold
    const edgeResult = await session.run(
      `MATCH (c1:Content {userId: $userId})-[r:SIMILAR_TO]-(c2:Content {userId: $userId})
       WHERE r.score >= $minSimilarity AND c1.id < c2.id
       RETURN c1.id AS source, c2.id AS target, r.score AS similarity
       ORDER BY r.score DESC
       LIMIT $limit`,
      { userId, minSimilarity, limit: neo4jInt(limit) }
    );

    const edges: Neo4jEdge[] = edgeResult.records.map((r) => ({
      source: r.get('source') as string,
      target: r.get('target') as string,
      similarity: (r.get('similarity') as number) ?? 0,
    }));

    // Collect all node IDs from edges
    const nodeIds = new Set<string>();
    for (const edge of edges) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }

    if (nodeIds.size === 0) {
      return { nodes: [], edges: [] };
    }

    // Fetch node details with their tags
    const nodeResult = await session.run(
      `MATCH (c:Content {userId: $userId})
       WHERE c.id IN $ids
       OPTIONAL MATCH (c)-[:TAGGED_WITH]->(t:Tag)
       RETURN c.id AS id, c.title AS title, c.type AS type, COLLECT(t.name) AS tags`,
      { userId, ids: [...nodeIds] }
    );

    const nodes: Neo4jNode[] = nodeResult.records.map((r) => ({
      id: r.get('id') as string,
      title: r.get('title') as string,
      type: r.get('type') as string,
      tags: (r.get('tags') as string[]) ?? [],
    }));

    return { nodes, edges };
  });
  return result ?? null;
}

/**
 * Get the neighborhood of a node (N hops).
 */
export async function getNodeNeighborhood(
  nodeId: string,
  userId: string,
  hops = 2
): Promise<Neo4jGraphData | null> {
  const safeHops = Math.min(Math.max(hops, 1), 5);

  const result = await withNeo4jSession(async (session) => {
    const queryResult = await session.run(
      `MATCH path = (start:Content {id: $nodeId, userId: $userId})-[:SIMILAR_TO*1..${safeHops}]-(neighbor:Content {userId: $userId})
       WITH start, neighbor, relationships(path) AS rels
       UNWIND rels AS r
       WITH start, neighbor, r, startNode(r) AS s, endNode(r) AS e
       RETURN DISTINCT
         CASE WHEN s.id < e.id THEN s.id ELSE e.id END AS source,
         CASE WHEN s.id < e.id THEN e.id ELSE s.id END AS target,
         r.score AS similarity`,
      { nodeId, userId }
    );

    const edges: Neo4jEdge[] = queryResult.records.map((r) => ({
      source: r.get('source') as string,
      target: r.get('target') as string,
      similarity: (r.get('similarity') as number) ?? 0,
    }));

    const nodeIds = new Set<string>();
    for (const edge of edges) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }

    if (nodeIds.size === 0) {
      return { nodes: [], edges: [] };
    }

    const nodeResult = await session.run(
      `MATCH (c:Content {userId: $userId})
       WHERE c.id IN $ids
       OPTIONAL MATCH (c)-[:TAGGED_WITH]->(t:Tag)
       RETURN c.id AS id, c.title AS title, c.type AS type, COLLECT(t.name) AS tags`,
      { userId, ids: [...nodeIds] }
    );

    const nodes: Neo4jNode[] = nodeResult.records.map((r) => ({
      id: r.get('id') as string,
      title: r.get('title') as string,
      type: r.get('type') as string,
      tags: (r.get('tags') as string[]) ?? [],
    }));

    return { nodes, edges };
  });
  return result ?? null;
}

/**
 * Find the shortest path between two content nodes.
 */
export async function getShortestPath(
  sourceId: string,
  targetId: string,
  userId: string
): Promise<Neo4jGraphData | null> {
  const result = await withNeo4jSession(async (session) => {
    const queryResult = await session.run(
      `MATCH (s:Content {id: $sourceId, userId: $userId}),
             (t:Content {id: $targetId, userId: $userId}),
             path = shortestPath((s)-[:SIMILAR_TO*]-(t))
       WITH nodes(path) AS ns, relationships(path) AS rels
       UNWIND rels AS r
       WITH ns, r, startNode(r) AS s, endNode(r) AS e
       RETURN DISTINCT
         CASE WHEN s.id < e.id THEN s.id ELSE e.id END AS source,
         CASE WHEN s.id < e.id THEN e.id ELSE s.id END AS target,
         r.score AS similarity,
         [n IN ns | n.id] AS nodeIds`,
      { sourceId, targetId, userId }
    );

    if (queryResult.records.length === 0) {
      return { nodes: [], edges: [] };
    }

    const edges: Neo4jEdge[] = queryResult.records.map((r) => ({
      source: r.get('source') as string,
      target: r.get('target') as string,
      similarity: (r.get('similarity') as number) ?? 0,
    }));

    // Collect unique node IDs from all path records
    const nodeIds = new Set<string>();
    for (const record of queryResult.records) {
      const ids = record.get('nodeIds') as string[];
      for (const id of ids) nodeIds.add(id);
    }

    const nodeResult = await session.run(
      `MATCH (c:Content {userId: $userId})
       WHERE c.id IN $ids
       OPTIONAL MATCH (c)-[:TAGGED_WITH]->(t:Tag)
       RETURN c.id AS id, c.title AS title, c.type AS type, COLLECT(t.name) AS tags`,
      { userId, ids: [...nodeIds] }
    );

    const nodes: Neo4jNode[] = nodeResult.records.map((r) => ({
      id: r.get('id') as string,
      title: r.get('title') as string,
      type: r.get('type') as string,
      tags: (r.get('tags') as string[]) ?? [],
    }));

    return { nodes, edges };
  });
  return result ?? null;
}

/**
 * Get tag clusters: groups of tags with their associated content IDs.
 */
export async function getTagClusters(
  userId: string,
  minCount = 2
): Promise<Array<{ tag: string; contentIds: string[]; count: number }> | null> {
  const result = await withNeo4jSession(async (session) => {
    const queryResult = await session.run(
      `MATCH (c:Content {userId: $userId})-[:TAGGED_WITH]->(t:Tag)
       WITH t, COLLECT(c.id) AS contentIds
       WHERE SIZE(contentIds) >= $minCount
       RETURN t.name AS tag, contentIds, SIZE(contentIds) AS count
       ORDER BY count DESC`,
      { userId, minCount: neo4jInt(minCount) }
    );

    return queryResult.records.map((r) => ({
      tag: r.get('tag') as string,
      contentIds: r.get('contentIds') as string[],
      count: (r.get('count') as { low: number })?.low ?? (r.get('count') as number),
    }));
  });
  return result ?? null;
}

/**
 * Helper to convert number to Neo4j Integer for LIMIT/skip params
 */
function neo4jInt(value: number): number {
  return Math.floor(value);
}
