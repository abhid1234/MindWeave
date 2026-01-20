'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { createContentSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: { id: string };
  errors?: Partial<Record<string, string[]>>;
};

export async function createContentAction(formData: FormData): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Parse and prepare data
    const rawData = {
      type: formData.get('type'),
      title: formData.get('title'),
      body: formData.get('body') || '',
      url: formData.get('url') || '',
      tags: (formData.get('tags') as string)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    // Validate with Zod
    const validationResult = createContentSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Validation failed. Please check your input.',
        errors,
      };
    }

    const validatedData = validationResult.data;

    // Insert into database
    const [newContent] = await db
      .insert(content)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        title: validatedData.title,
        body: validatedData.body || null,
        url: validatedData.url || null,
        tags: validatedData.tags,
        autoTags: [], // TODO: Generate with Claude API
        metadata: validatedData.metadata || {},
      })
      .returning({ id: content.id });

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Content saved successfully!',
      data: { id: newContent.id },
    };
  } catch (error) {
    console.error('Error creating content:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      message: 'Failed to save content. Please try again.',
    };
  }
}
