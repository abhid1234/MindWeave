'use server';

import { auth } from '@/lib/auth';
import { clusterContent, type ContentCluster } from '@/lib/ai/clustering';

export type ClusterResult = {
  success: boolean;
  clusters: ContentCluster[];
  message?: string;
};

/**
 * Get content clusters for the current user
 */
export async function getClustersAction(
  numClusters = 5
): Promise<ClusterResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, clusters: [], message: 'Unauthorized' };
    }

    const clusters = await clusterContent(session.user.id, numClusters);

    return { success: true, clusters };
  } catch (error) {
    console.error('Error getting clusters:', error);
    return { success: false, clusters: [], message: 'Failed to generate clusters' };
  }
}
