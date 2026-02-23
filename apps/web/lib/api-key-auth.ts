import crypto from 'crypto';
import { db } from './db/client';
import { apiKeys } from './db/schema';
import { eq } from 'drizzle-orm';

const API_KEY_PREFIX = 'mw_';

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomPart = crypto.randomBytes(20).toString('hex'); // 40 hex chars
  const raw = `${API_KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, API_KEY_PREFIX.length + 5); // "mw_" + first 5 hex chars
  return { raw, hash, prefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export type ApiKeyAuthResult =
  | { success: true; userId: string; keyId: string }
  | { success: false; error: string };

export async function authenticateApiKey(
  request: Request
): Promise<ApiKeyAuthResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid Authorization header.' };
  }

  const token = authHeader.slice(7);
  if (!token.startsWith(API_KEY_PREFIX)) {
    return { success: false, error: 'Invalid API key format.' };
  }

  const hash = hashApiKey(token);

  const [key] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      isActive: apiKeys.isActive,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (!key) {
    return { success: false, error: 'Invalid API key.' };
  }

  if (!key.isActive) {
    return { success: false, error: 'API key has been revoked.' };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { success: false, error: 'API key has expired.' };
  }

  // Update lastUsedAt (non-blocking)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .catch((err) => console.error('Failed to update API key lastUsedAt:', err));

  return { success: true, userId: key.userId, keyId: key.id };
}
