/**
 * Batch Embedding Generation Script
 *
 * This script generates embeddings for all content that doesn't have one yet.
 * Useful for backfilling embeddings for existing content.
 *
 * Usage:
 *   tsx scripts/generate-embeddings.ts
 *
 * Options (via environment variables):
 *   BATCH_SIZE=10       - Number of items to process per batch (default: 10)
 *   BATCH_DELAY_MS=1000 - Delay between batches in ms (default: 1000)
 *   DRY_RUN=true        - Preview what would be processed without making changes
 *
 * Make sure GOOGLE_AI_API_KEY is set in your environment.
 */

import { db } from '../apps/web/lib/db/client';
import { content, embeddings } from '../apps/web/lib/db/schema';
import { upsertContentEmbedding } from '../apps/web/lib/ai/embeddings';
import { sql, notInArray } from 'drizzle-orm';

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '1000', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';

interface ProcessingStats {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

const stats: ProcessingStats = {
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
};

function printProgress(): void {
  const percent = stats.total > 0 ? ((stats.processed / stats.total) * 100).toFixed(1) : '0';
  console.log(
    `Progress: ${stats.processed}/${stats.total} (${percent}%) | ` +
    `✅ ${stats.succeeded} | ❌ ${stats.failed} | ⏭️  ${stats.skipped}`
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getContentWithoutEmbeddings(): Promise<Array<{ id: string; title: string }>> {
  // Get all content IDs that have embeddings
  const contentWithEmbeddings = await db
    .select({ contentId: embeddings.contentId })
    .from(embeddings);

  const contentIdsWithEmbeddings = contentWithEmbeddings.map((e) => e.contentId);

  // Get content that doesn't have embeddings
  if (contentIdsWithEmbeddings.length === 0) {
    // If no embeddings exist, get all content
    return db
      .select({ id: content.id, title: content.title })
      .from(content)
      .orderBy(content.createdAt);
  }

  return db
    .select({ id: content.id, title: content.title })
    .from(content)
    .where(notInArray(content.id, contentIdsWithEmbeddings))
    .orderBy(content.createdAt);
}

async function processContent(item: { id: string; title: string }): Promise<boolean> {
  try {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would process: ${item.title} (${item.id})`);
      return true;
    }

    await upsertContentEmbedding(item.id);
    console.log(`  ✅ Generated embedding for: ${item.title}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Failed to generate embedding for ${item.title}: ${errorMessage}`);
    return false;
  }
}

async function processBatch(items: Array<{ id: string; title: string }>): Promise<void> {
  for (const item of items) {
    const success = await processContent(item);
    stats.processed++;
    if (success) {
      stats.succeeded++;
    } else {
      stats.failed++;
    }
  }
}

async function main(): Promise<void> {
  console.log('🔍 Scanning for content without embeddings...');
  console.log('');
  console.log(`Configuration:`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Batch delay: ${BATCH_DELAY_MS}ms`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log('');

  // Check for API key
  if (!process.env.GOOGLE_AI_API_KEY && !DRY_RUN) {
    console.error('❌ GOOGLE_AI_API_KEY is not set. Cannot generate embeddings.');
    console.log('   Set the environment variable or run with DRY_RUN=true to preview.');
    process.exit(1);
  }

  // Get content without embeddings
  const contentToProcess = await getContentWithoutEmbeddings();
  stats.total = contentToProcess.length;

  if (stats.total === 0) {
    console.log('✅ All content already has embeddings. Nothing to do!');
    process.exit(0);
  }

  console.log(`📋 Found ${stats.total} content items without embeddings`);
  console.log('');

  // Process in batches
  const totalBatches = Math.ceil(stats.total / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, stats.total);
    const batch = contentToProcess.slice(batchStart, batchEnd);

    console.log(`\n📦 Processing batch ${i + 1}/${totalBatches} (items ${batchStart + 1}-${batchEnd})`);

    await processBatch(batch);
    printProgress();

    // Add delay between batches (except for the last one)
    if (i < totalBatches - 1 && !DRY_RUN) {
      console.log(`   Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Final summary
  console.log('');
  console.log('═'.repeat(50));
  console.log('📊 Final Summary');
  console.log('═'.repeat(50));
  console.log(`  Total items: ${stats.total}`);
  console.log(`  Succeeded: ${stats.succeeded}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log('');

  if (DRY_RUN) {
    console.log('🔵 This was a dry run. No changes were made.');
    console.log('   Run without DRY_RUN=true to actually generate embeddings.');
  } else if (stats.failed > 0) {
    console.log('⚠️  Some embeddings failed to generate. Check the errors above.');
    console.log('   You can re-run this script to retry failed items.');
  } else {
    console.log('🎉 All embeddings generated successfully!');
  }

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
