import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

type ExportFormat = 'json' | 'markdown' | 'csv';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check rate limit first to prevent DoS
    const rateLimitResult = checkRateLimit(request, 'export', RATE_LIMITS.export);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const { contentIds, format = 'json' } = body as {
      contentIds?: string[];
      format?: ExportFormat;
    };

    // Build query conditions
    const conditions = [eq(content.userId, session.user.id)];
    if (contentIds && contentIds.length > 0) {
      conditions.push(inArray(content.id, contentIds));
    }

    // Fetch content
    const items = await db
      .select({
        id: content.id,
        type: content.type,
        title: content.title,
        body: content.body,
        url: content.url,
        tags: content.tags,
        autoTags: content.autoTags,
        metadata: content.metadata,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(and(...conditions));

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No content found to export' },
        { status: 404 }
      );
    }

    // Generate export based on format
    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'markdown':
        exportData = generateMarkdown(items);
        contentType = 'text/markdown';
        filename = 'mindweave-export.md';
        break;
      case 'csv':
        exportData = generateCsv(items);
        contentType = 'text/csv';
        filename = 'mindweave-export.csv';
        break;
      case 'json':
      default:
        exportData = JSON.stringify(items, null, 2);
        contentType = 'application/json';
        filename = 'mindweave-export.json';
        break;
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...rateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to export content' },
      { status: 500 }
    );
  }
}

type ExportItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function generateMarkdown(items: ExportItem[]): string {
  const lines: string[] = [
    '# Mindweave Export',
    '',
    `Exported on: ${new Date().toISOString()}`,
    `Total items: ${items.length}`,
    '',
    '---',
    '',
  ];

  for (const item of items) {
    lines.push(`## ${item.title}`);
    lines.push('');
    lines.push(`**Type:** ${item.type}`);
    lines.push(`**Created:** ${new Date(item.createdAt).toLocaleString()}`);

    if (item.url) {
      lines.push(`**URL:** [${item.url}](${item.url})`);
    }

    if (item.tags.length > 0) {
      lines.push(`**Tags:** ${item.tags.join(', ')}`);
    }

    if (item.autoTags.length > 0) {
      lines.push(`**Auto Tags:** ${item.autoTags.join(', ')}`);
    }

    if (item.body) {
      lines.push('');
      lines.push('### Content');
      lines.push('');
      lines.push(item.body);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function generateCsv(items: ExportItem[]): string {
  const headers = [
    'ID',
    'Type',
    'Title',
    'Body',
    'URL',
    'Tags',
    'Auto Tags',
    'Created At',
    'Updated At',
  ];

  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = items.map((item) => [
    escapeCSV(item.id),
    escapeCSV(item.type),
    escapeCSV(item.title),
    escapeCSV(item.body),
    escapeCSV(item.url),
    escapeCSV(item.tags.join('; ')),
    escapeCSV(item.autoTags.join('; ')),
    escapeCSV(new Date(item.createdAt).toISOString()),
    escapeCSV(new Date(item.updatedAt).toISOString()),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
