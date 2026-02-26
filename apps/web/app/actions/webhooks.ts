'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { webhookConfigs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createWebhookConfigSchema } from '@/lib/validations';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

type ActionResult = {
  success: boolean;
  message: string;
};

type WebhookConfigItem = {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  secret: string | null;
  config: {
    channels?: string[];
    defaultTags?: string[];
    contentType?: string;
  } | null;
  lastReceivedAt: Date | null;
  totalReceived: number;
  createdAt: Date;
  updatedAt: Date;
};

type GetWebhookConfigsResult = {
  success: boolean;
  configs: WebhookConfigItem[];
  message?: string;
};

export async function getWebhookConfigsAction(): Promise<GetWebhookConfigsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, configs: [], message: 'Unauthorized' };
    }

    const configs = await db
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.userId, session.user.id))
      .orderBy(webhookConfigs.createdAt);

    return {
      success: true,
      configs: configs.map((c) => ({
        ...c,
        config: c.config as WebhookConfigItem['config'],
      })),
    };
  } catch (error) {
    console.error('Get webhook configs error:', error);
    return { success: false, configs: [], message: 'Failed to fetch webhook configs' };
  }
}

export async function createWebhookConfigAction(
  params: z.infer<typeof createWebhookConfigSchema>
): Promise<ActionResult & { config?: WebhookConfigItem }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'createWebhookConfig', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validatedData = createWebhookConfigSchema.parse(params);

    const [newConfig] = await db
      .insert(webhookConfigs)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        name: validatedData.name,
        secret: validatedData.secret ?? null,
        config: validatedData.config ?? null,
      })
      .returning();

    revalidatePath('/dashboard/profile');

    return {
      success: true,
      message: 'Webhook created successfully',
      config: {
        ...newConfig,
        config: newConfig.config as WebhookConfigItem['config'],
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Create webhook config error:', error);
    return { success: false, message: 'Failed to create webhook config' };
  }
}

export async function updateWebhookConfigAction(
  webhookId: string,
  updates: { isActive?: boolean; name?: string; secret?: string; config?: Record<string, unknown> }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'updateWebhookConfig', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const [existing] = await db
      .select({ id: webhookConfigs.id })
      .from(webhookConfigs)
      .where(and(eq(webhookConfigs.id, webhookId), eq(webhookConfigs.userId, session.user.id)));

    if (!existing) {
      return { success: false, message: 'Webhook not found' };
    }

    await db
      .update(webhookConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhookConfigs.id, webhookId));

    revalidatePath('/dashboard/profile');

    return { success: true, message: 'Webhook updated successfully' };
  } catch (error) {
    console.error('Update webhook config error:', error);
    return { success: false, message: 'Failed to update webhook config' };
  }
}

export async function deleteWebhookConfigAction(webhookId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'deleteWebhookConfig', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const [existing] = await db
      .select({ id: webhookConfigs.id })
      .from(webhookConfigs)
      .where(and(eq(webhookConfigs.id, webhookId), eq(webhookConfigs.userId, session.user.id)));

    if (!existing) {
      return { success: false, message: 'Webhook not found' };
    }

    await db.delete(webhookConfigs).where(eq(webhookConfigs.id, webhookId));

    revalidatePath('/dashboard/profile');

    return { success: true, message: 'Webhook deleted successfully' };
  } catch (error) {
    console.error('Delete webhook config error:', error);
    return { success: false, message: 'Failed to delete webhook config' };
  }
}
