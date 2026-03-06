'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { brainDumpInputSchema, saveBrainDumpNotesSchema } from '@/lib/validations';
import { processBrainDump, type BrainDumpResult } from '@/lib/ai/brain-dump';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { syncContentToNeo4j } from '@/lib/neo4j/sync';
import { revalidatePath } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { CacheTags } from '@/lib/cache';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { checkAndUnlockBadgesAction } from './badges';

export type BrainDumpActionResult = {
  success: boolean;
  message: string;
  data?: BrainDumpResult;
};

export type SaveBrainDumpResult = {
  success: boolean;
  message: string;
  data?: { ids: string[] };
};

export async function processBrainDumpAction(rawText: string): Promise<BrainDumpActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'processBrainDump', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validation = brainDumpInputSchema.safeParse({ rawText });
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const msg = errors.rawText?.[0] || 'Invalid input';
      return { success: false, message: msg };
    }

    const result = await processBrainDump({ rawText: validation.data.rawText });

    return {
      success: true,
      message: result.summary,
      data: result,
    };
  } catch (error) {
    console.error('Error processing brain dump:', error);
    return {
      success: false,
      message: 'Failed to process brain dump. Please try again.',
    };
  }
}

export async function saveBrainDumpNotesAction(input: {
  notes: Array<{
    title: string;
    body?: string;
    tags: string[];
    actionItems: string[];
  }>;
  sourceText?: string;
}): Promise<SaveBrainDumpResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'saveBrainDumpNotes', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validation = saveBrainDumpNotesSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const msg = errors.notes?.[0] || 'Invalid input';
      return { success: false, message: msg };
    }

    const { notes } = validation.data;

    // Bulk insert all notes
    const rows = await db
      .insert(content)
      .values(
        notes.map((note) => ({
          userId: session.user!.id!,
          type: 'note' as const,
          title: note.title,
          body: note.body || null,
          tags: note.tags,
          metadata: {
            source: 'brain-dump',
            actionItems: note.actionItems,
          },
        }))
      )
      .returning({ id: content.id });

    const ids = rows.map((r) => r.id);

    // Fire embeddings + neo4j sync per note (non-blocking)
    for (const id of ids) {
      upsertContentEmbedding(id).catch((error) => {
        console.error('Failed to generate embedding for brain dump note:', id, error);
      });
      syncContentToNeo4j(id).catch((error) => {
        console.error('Failed to sync brain dump note to Neo4j:', id, error);
      });
    }

    // Check for badge unlocks (non-blocking)
    checkAndUnlockBadgesAction('content_created').catch(console.error);
    checkAndUnlockBadgesAction('brain_dump_processed').catch(console.error);

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');
    revalidateTag(CacheTags.ANALYTICS);
    revalidateTag(CacheTags.CONTENT);

    return {
      success: true,
      message: `Saved ${ids.length} notes from your brain dump!`,
      data: { ids },
    };
  } catch (error) {
    console.error('Error saving brain dump notes:', error);
    return {
      success: false,
      message: 'Failed to save notes. Please try again.',
    };
  }
}
