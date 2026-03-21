'use server';

import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

interface SocialProofStats {
  tilCount: number;
  collectionCount: number;
  noteCount: number;
  userCount: number;
}

let cachedStats: SocialProofStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getSocialProofStats(): Promise<{
  success: boolean;
  data?: SocialProofStats;
  message?: string;
}> {
  try {
    if (cachedStats && Date.now() - cacheTimestamp < CACHE_TTL) {
      return { success: true, data: cachedStats };
    }
    const result = await db.execute<{
      til_count: number;
      collection_count: number;
      note_count: number;
      user_count: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*) FROM til_posts)::int as til_count,
        (SELECT COUNT(*) FROM collections)::int as collection_count,
        (SELECT COUNT(*) FROM content)::int as note_count,
        (SELECT COUNT(*) FROM users)::int as user_count
    `);
    const row = result[0] ?? { til_count: 0, collection_count: 0, note_count: 0, user_count: 0 };
    cachedStats = {
      tilCount: row.til_count,
      collectionCount: row.collection_count,
      noteCount: row.note_count,
      userCount: row.user_count,
    };
    cacheTimestamp = Date.now();
    return { success: true, data: cachedStats };
  } catch (error) {
    console.error('Error fetching social proof stats:', error);
    return { success: false, message: 'Failed to fetch stats.' };
  }
}
