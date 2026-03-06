'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { refineContent } from '@/lib/ai/refine';
import { refineContentSchema } from '@/lib/validations';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export type RefineContentResponse = {
  success: boolean;
  message?: string;
  refined?: string;
  original?: string;
};

/**
 * Refine content body using AI with a specified tone.
 * Returns the refined text for preview — does NOT save automatically.
 */
export async function refineContentAction(
  input: unknown
): Promise<RefineContentResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'refineContent',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message };
    }

    const parsed = refineContentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0].message,
      };
    }

    const { contentId, tone, customInstruction } = parsed.data;
    const userId = session.user.id;

    // Fetch content and verify ownership
    const [item] = await db
      .select({
        id: content.id,
        body: content.body,
      })
      .from(content)
      .where(and(eq(content.id, contentId), eq(content.userId, userId)));

    if (!item) {
      return {
        success: false,
        message: 'Content not found.',
      };
    }

    if (!item.body) {
      return {
        success: false,
        message: 'Content has no body text to refine.',
      };
    }

    // Refine via AI
    const refined = await refineContent({
      text: item.body,
      tone,
      customInstruction,
    });

    return {
      success: true,
      refined,
      original: item.body,
    };
  } catch (error) {
    console.error('Error refining content:', error);
    return {
      success: false,
      message: 'Failed to refine content. Please try again.',
    };
  }
}
