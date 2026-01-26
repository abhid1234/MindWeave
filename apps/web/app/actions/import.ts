'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { bulkImportSchema } from '@/lib/validations';
import { generateTags } from '@/lib/ai/claude';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { revalidatePath } from 'next/cache';
import { eq, and, or, inArray } from 'drizzle-orm';
import { ImportResult, ImportItem, ImportError } from '@/lib/import/types';
import { batchArray, normalizeTags } from '@/lib/import/utils';

const BATCH_SIZE = 10;

export async function importContentAction(
  items: ImportItem[],
  options?: {
    skipDuplicates?: boolean;
    generateAutoTags?: boolean;
    generateEmbeddings?: boolean;
    additionalTags?: string[];
  }
): Promise<ImportResult> {
  const {
    skipDuplicates = true,
    generateAutoTags = true,
    generateEmbeddings = true,
    additionalTags = [],
  } = options || {};

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        createdIds: [],
      };
    }

    // Validate input
    console.log('Import action called with', items.length, 'items');
    const validationResult = bulkImportSchema.safeParse({ items, options });
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(', ');
      return {
        success: false,
        message: `Validation failed: ${errorMessages}`,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        createdIds: [],
      };
    }

    // Use validated data
    const validatedItems = validationResult.data.items;
    console.log('Validated items:', validatedItems.length);

    const userId = session.user.id;
    const errors: ImportError[] = [];
    const createdIds: string[] = [];
    let skipped = 0;

    // Find duplicates if needed
    let existingUrls = new Set<string>();
    let existingTitles = new Set<string>();

    if (skipDuplicates) {
      // Get URLs for link items
      const linkUrls = validatedItems
        .filter((item) => item.type === 'link' && item.url)
        .map((item) => item.url as string);

      // Get titles for note items
      const noteTitles = validatedItems
        .filter((item) => item.type === 'note')
        .map((item) => item.title.toLowerCase().trim());

      // Check existing URLs
      if (linkUrls.length > 0) {
        const existingLinks = await db
          .select({ url: content.url })
          .from(content)
          .where(and(eq(content.userId, userId), inArray(content.url, linkUrls)));

        existingUrls = new Set(existingLinks.map((l) => l.url?.toLowerCase() || ''));
      }

      // Check existing note titles
      if (noteTitles.length > 0) {
        const existingNotes = await db
          .select({ title: content.title })
          .from(content)
          .where(
            and(
              eq(content.userId, userId),
              eq(content.type, 'note'),
              or(...noteTitles.map((t) => eq(content.title, t)))
            )
          );

        existingTitles = new Set(existingNotes.map((n) => n.title.toLowerCase().trim()));
      }
    }

    // Process items in batches
    const batches = batchArray(validatedItems, BATCH_SIZE);

    for (const batch of batches) {
      const batchInserts: Array<{
        item: ImportItem;
        insertData: typeof content.$inferInsert;
      }> = [];

      for (const item of batch) {
        // Check for duplicates
        if (skipDuplicates) {
          if (item.type === 'link' && item.url) {
            if (existingUrls.has(item.url.toLowerCase())) {
              skipped++;
              continue;
            }
          } else if (item.type === 'note') {
            if (existingTitles.has(item.title.toLowerCase().trim())) {
              skipped++;
              continue;
            }
          }
        }

        // Merge tags with additional tags
        const mergedTags = normalizeTags([...item.tags, ...additionalTags]);

        // Prepare insert data - ensure createdAt is a valid Date
        let itemCreatedAt: Date;
        if (item.createdAt) {
          // Handle both Date objects and ISO strings
          itemCreatedAt = item.createdAt instanceof Date
            ? item.createdAt
            : new Date(item.createdAt);
          // Validate the date
          if (isNaN(itemCreatedAt.getTime())) {
            itemCreatedAt = new Date();
          }
        } else {
          itemCreatedAt = new Date();
        }

        const insertData: typeof content.$inferInsert = {
          userId,
          type: item.type,
          title: item.title,
          body: item.body || null,
          url: item.url || null,
          tags: mergedTags,
          autoTags: [], // Will be populated later if generateAutoTags is true
          metadata: {
            ...item.metadata,
            importedAt: new Date().toISOString(),
          },
          createdAt: itemCreatedAt,
        };

        batchInserts.push({ item, insertData });

        // Add to existing sets to prevent duplicates within the same import
        if (item.type === 'link' && item.url) {
          existingUrls.add(item.url.toLowerCase());
        } else if (item.type === 'note') {
          existingTitles.add(item.title.toLowerCase().trim());
        }
      }

      // Insert batch
      if (batchInserts.length > 0) {
        try {
          const insertedItems = await db
            .insert(content)
            .values(batchInserts.map((b) => b.insertData))
            .returning({ id: content.id });

          // Store created IDs
          for (const inserted of insertedItems) {
            createdIds.push(inserted.id);
          }

          // Generate auto-tags and embeddings asynchronously for each inserted item
          for (let i = 0; i < insertedItems.length; i++) {
            const contentId = insertedItems[i].id;
            const item = batchInserts[i].item;

            // Generate auto-tags (non-blocking)
            if (generateAutoTags) {
              generateTagsAsync(contentId, item).catch((error) => {
                console.error('Failed to generate auto-tags for content:', contentId, error);
              });
            }

            // Generate embedding (non-blocking)
            if (generateEmbeddings) {
              upsertContentEmbedding(contentId).catch((error) => {
                console.error('Failed to generate embedding for content:', contentId, error);
              });
            }
          }
        } catch (batchError) {
          console.error('Batch insert error:', batchError);
          // Add errors for all items in the failed batch
          for (const { item } of batchInserts) {
            errors.push({
              item: item.title,
              reason: batchError instanceof Error ? batchError.message : 'Database error',
            });
          }
        }
      }
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');

    const imported = createdIds.length;
    const failed = errors.length;

    return {
      success: imported > 0 || (validatedItems.length === 0),
      message: imported > 0
        ? `Successfully imported ${imported} item${imported === 1 ? '' : 's'}${skipped > 0 ? `. ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped.` : ''}`
        : skipped > 0
          ? `No new items imported. ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped.`
          : 'No items to import.',
      imported,
      skipped,
      failed,
      errors,
      createdIds,
    };
  } catch (error) {
    console.error('Import action error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import content.',
      imported: 0,
      skipped: 0,
      failed: items.length,
      errors: items.slice(0, 10).map((item) => ({
        item: item.title,
        reason: 'Unexpected error during import',
      })),
      createdIds: [],
    };
  }
}

/**
 * Generate auto-tags for imported content asynchronously
 */
async function generateTagsAsync(contentId: string, item: ImportItem): Promise<void> {
  try {
    const autoTags = await generateTags({
      title: item.title,
      body: item.body,
      url: item.url,
      type: item.type,
    });

    if (autoTags.length > 0) {
      await db
        .update(content)
        .set({ autoTags })
        .where(eq(content.id, contentId));
    }
  } catch (error) {
    console.error('Auto-tagging failed for content:', contentId, error);
  }
}
