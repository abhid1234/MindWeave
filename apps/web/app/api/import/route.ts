/**
 * Import API Route
 *
 * POST /api/import - Parse an uploaded file and return preview items
 * SECURITY: Rate limited to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  ImportSource,
  ParseResult,
  getImportSource,
} from '@/lib/import/types';
import {
  parseBookmarks,
  isBookmarksFile,
  parsePocket,
  parsePocketCsv,
  isPocketFile,
  parseNotion,
  parseEvernote,
  isEvernoteFile,
  parseTwitterBookmarks,
  isTwitterBookmarksFile,
} from '@/lib/import/parsers';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check rate limit first to prevent DoS
    const rateLimitResult = checkRateLimit(request, 'import', RATE_LIMITS.import);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceType = formData.get('source') as ImportSource | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided.' },
        { status: 400 }
      );
    }

    if (!sourceType) {
      return NextResponse.json(
        { success: false, message: 'No import source type specified.' },
        { status: 400 }
      );
    }

    // Validate source type
    const sourceConfig = getImportSource(sourceType);
    if (!sourceConfig) {
      return NextResponse.json(
        { success: false, message: `Invalid import source: ${sourceType}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        },
        { status: 400 }
      );
    }

    // Parse based on source type
    let result: ParseResult;

    switch (sourceType) {
      case 'bookmarks': {
        const content = await file.text();
        if (!isBookmarksFile(content)) {
          return NextResponse.json(
            {
              success: false,
              message: 'This does not appear to be a valid bookmarks HTML file.',
            },
            { status: 400 }
          );
        }
        result = parseBookmarks(content);
        break;
      }

      case 'pocket': {
        const content = await file.text();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
          result = parsePocketCsv(content);
        } else {
          if (!isPocketFile(content)) {
            return NextResponse.json(
              {
                success: false,
                message: 'This does not appear to be a valid Pocket export file.',
              },
              { status: 400 }
            );
          }
          result = parsePocket(content);
        }
        break;
      }

      case 'notion': {
        const buffer = await file.arrayBuffer();
        result = await parseNotion(buffer);
        break;
      }

      case 'evernote': {
        const content = await file.text();
        if (!isEvernoteFile(content)) {
          return NextResponse.json(
            {
              success: false,
              message: 'This does not appear to be a valid Evernote ENEX file.',
            },
            { status: 400 }
          );
        }
        result = parseEvernote(content);
        break;
      }

      case 'twitter': {
        const content = await file.text();
        if (!isTwitterBookmarksFile(content)) {
          return NextResponse.json(
            {
              success: false,
              message: 'This does not appear to be a valid X/Twitter bookmarks.js file.',
            },
            { status: 400 }
          );
        }
        result = parseTwitterBookmarks(content);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unsupported import source: ${sourceType}` },
          { status: 400 }
        );
    }

    // Return parse result
    return NextResponse.json(
      {
        success: result.success,
        items: result.items,
        errors: result.errors,
        warnings: result.warnings,
        stats: result.stats,
      },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse import file.',
      },
      { status: 500 }
    );
  }
}
