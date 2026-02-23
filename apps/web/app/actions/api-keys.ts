'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { apiKeys } from '@/lib/db/schema';
import { generateApiKey } from '@/lib/api-key-auth';
import { eq, and, desc } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export type ApiKeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type ListApiKeysResult = {
  success: boolean;
  message?: string;
  keys: ApiKeyListItem[];
};

export async function listApiKeysAction(): Promise<ListApiKeysResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', keys: [] };
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(desc(apiKeys.createdAt));

    return { success: true, keys };
  } catch (error) {
    console.error('Error listing API keys:', error);
    return { success: false, message: 'Failed to load API keys.', keys: [] };
  }
}

export type CreateApiKeyResult = {
  success: boolean;
  message: string;
  rawKey?: string;
  keyId?: string;
};

export async function createApiKeyAction(params: {
  name: string;
  expiresInDays?: number;
}): Promise<CreateApiKeyResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'createApiKey',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const { name, expiresInDays } = params;

    if (!name || name.trim().length === 0 || name.length > 100) {
      return { success: false, message: 'Name is required and must be under 100 characters.' };
    }

    // Check max 10 active keys
    const activeKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, session.user.id), eq(apiKeys.isActive, true)));

    if (activeKeys.length >= 10) {
      return {
        success: false,
        message: 'Maximum 10 active API keys allowed. Revoke an existing key first.',
      };
    }

    const { raw, hash, prefix } = generateApiKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: session.user.id,
        name: name.trim(),
        keyPrefix: prefix,
        keyHash: hash,
        expiresAt,
      })
      .returning({ id: apiKeys.id });

    return {
      success: true,
      message: 'API key created. Copy it now — it won\'t be shown again.',
      rawKey: raw,
      keyId: newKey.id,
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return { success: false, message: 'Failed to create API key.' };
  }
}

export type RevokeApiKeyResult = {
  success: boolean;
  message: string;
};

export async function revokeApiKeyAction(keyId: string): Promise<RevokeApiKeyResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'revokeApiKey',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const [key] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)))
      .limit(1);

    if (!key) {
      return { success: false, message: 'API key not found.' };
    }

    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId));

    return { success: true, message: 'API key revoked.' };
  } catch (error) {
    console.error('Error revoking API key:', error);
    return { success: false, message: 'Failed to revoke API key.' };
  }
}
