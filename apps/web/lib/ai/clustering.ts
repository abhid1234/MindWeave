import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db/client';
import { content, embeddings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ContentCluster {
  id: string;
  name: string;
  description: string;
  contentIds: string[];
  contentPreviews: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  size: number;
}

interface ContentWithEmbedding {
  contentId: string;
  title: string;
  type: string;
  embedding: number[];
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * K-means++ initialization for better initial centroids
 */
function initializeCentroids(data: ContentWithEmbedding[], k: number): number[][] {
  const centroids: number[][] = [];
  const n = data.length;

  // Choose first centroid randomly
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...data[firstIdx].embedding]);

  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDist = 0;

    for (const item of data) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(item.embedding, centroid);
        minDist = Math.min(minDist, dist);
      }
      distances.push(minDist * minDist);
      totalDist += minDist * minDist;
    }

    // Weighted random selection
    const random = Math.random() * totalDist;
    let cumulative = 0;
    for (let j = 0; j < n; j++) {
      cumulative += distances[j];
      if (cumulative >= random) {
        centroids.push([...data[j].embedding]);
        break;
      }
    }
  }

  return centroids;
}

/**
 * Assign data points to nearest centroid
 */
function assignClusters(data: ContentWithEmbedding[], centroids: number[][]): number[] {
  return data.map((item) => {
    let minDist = Infinity;
    let cluster = 0;
    for (let i = 0; i < centroids.length; i++) {
      const dist = euclideanDistance(item.embedding, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        cluster = i;
      }
    }
    return cluster;
  });
}

/**
 * Update centroids based on cluster assignments
 */
function updateCentroids(
  data: ContentWithEmbedding[],
  assignments: number[],
  k: number,
  dimensions: number
): number[][] {
  const newCentroids: number[][] = Array(k)
    .fill(null)
    .map(() => Array(dimensions).fill(0));
  const counts: number[] = Array(k).fill(0);

  for (let i = 0; i < data.length; i++) {
    const cluster = assignments[i];
    counts[cluster]++;
    for (let j = 0; j < dimensions; j++) {
      newCentroids[cluster][j] += data[i].embedding[j];
    }
  }

  // Average
  for (let i = 0; i < k; i++) {
    if (counts[i] > 0) {
      for (let j = 0; j < dimensions; j++) {
        newCentroids[i][j] /= counts[i];
      }
    }
  }

  return newCentroids;
}

/**
 * Simple k-means clustering algorithm
 */
function kMeans(
  data: ContentWithEmbedding[],
  k: number,
  maxIterations = 50
): { assignments: number[]; centroids: number[][] } {
  if (data.length === 0 || k <= 0) {
    return { assignments: [], centroids: [] };
  }

  // Limit k to number of data points
  k = Math.min(k, data.length);

  const dimensions = data[0].embedding.length;
  let centroids = initializeCentroids(data, k);
  let assignments: number[] = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newAssignments = assignClusters(data, centroids);

    // Check for convergence
    if (
      assignments.length > 0 &&
      assignments.every((a, i) => a === newAssignments[i])
    ) {
      break;
    }

    assignments = newAssignments;
    centroids = updateCentroids(data, assignments, k, dimensions);
  }

  return { assignments, centroids };
}

/**
 * Generate a descriptive name for a cluster using Claude
 */
async function generateClusterName(
  contents: Array<{ title: string; type: string }>
): Promise<{ name: string; description: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      name: 'Cluster',
      description: 'Group of related items',
    };
  }

  try {
    const titles = contents.slice(0, 10).map((c) => c.title).join(', ');
    const types = [...new Set(contents.map((c) => c.type))].join(', ');

    const prompt = `Based on these content items, suggest a short cluster name (2-4 words) and brief description (1 sentence).

Content titles: ${titles}
Content types: ${types}

Respond in JSON format:
{"name": "cluster name", "description": "brief description"}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content[0];
    if (textContent.type === 'text') {
      try {
        // Strip markdown code fences if present (e.g. ```json ... ```)
        const cleaned = textContent.text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        return {
          name: parsed.name || 'Cluster',
          description: parsed.description || 'Group of related items',
        };
      } catch {
        // If JSON parsing fails, try to extract name from text
        const nameMatch = textContent.text.match(/"name"\s*:\s*"([^"]+)"/);
        return {
          name: nameMatch ? nameMatch[1] : 'Cluster',
          description: 'Group of related items',
        };
      }
    }
  } catch (error) {
    console.error('Error generating cluster name:', error);
  }

  return {
    name: 'Cluster',
    description: 'Group of related items',
  };
}

/**
 * Cluster content for a user based on their embeddings
 */
export async function clusterContent(
  userId: string,
  numClusters = 5
): Promise<ContentCluster[]> {
  try {
    // Fetch content with embeddings
    const result = await db
      .select({
        contentId: content.id,
        title: content.title,
        type: content.type,
        embedding: embeddings.embedding,
      })
      .from(content)
      .innerJoin(embeddings, eq(content.id, embeddings.contentId))
      .where(eq(content.userId, userId));

    if (result.length < 2) {
      return [];
    }

    // Parse embeddings (they come as strings from the database)
    const data: ContentWithEmbedding[] = result.map((row) => ({
      contentId: row.contentId,
      title: row.title,
      type: row.type,
      embedding: typeof row.embedding === 'string'
        ? JSON.parse(row.embedding)
        : row.embedding,
    }));

    // Determine optimal number of clusters (max 8, or sqrt of data size)
    const optimalK = Math.min(
      numClusters,
      Math.max(2, Math.floor(Math.sqrt(data.length))),
      8
    );

    // Run k-means
    const { assignments } = kMeans(data, optimalK);

    // Group content by cluster
    const clusterGroups: Map<number, ContentWithEmbedding[]> = new Map();
    for (let i = 0; i < data.length; i++) {
      const cluster = assignments[i];
      if (!clusterGroups.has(cluster)) {
        clusterGroups.set(cluster, []);
      }
      clusterGroups.get(cluster)!.push(data[i]);
    }

    // Generate cluster names and build result
    const clusters: ContentCluster[] = [];

    for (const [clusterId, items] of clusterGroups.entries()) {
      if (items.length === 0) continue;

      const { name, description } = await generateClusterName(
        items.map((i) => ({ title: i.title, type: i.type }))
      );

      clusters.push({
        id: `cluster-${clusterId}`,
        name,
        description,
        contentIds: items.map((i) => i.contentId),
        contentPreviews: items.slice(0, 5).map((i) => ({
          id: i.contentId,
          title: i.title,
          type: i.type,
        })),
        size: items.length,
      });
    }

    // Sort by size descending
    clusters.sort((a, b) => b.size - a.size);

    return clusters;
  } catch (error) {
    console.error('Error clustering content:', error);
    return [];
  }
}

/**
 * Get cluster for a specific content item
 */
export async function getContentCluster(
  userId: string,
  contentId: string
): Promise<ContentCluster | null> {
  const clusters = await clusterContent(userId);
  return clusters.find((c) => c.contentIds.includes(contentId)) || null;
}
