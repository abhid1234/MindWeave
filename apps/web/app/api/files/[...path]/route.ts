import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * GET /api/files/[userId]/[filename]
 *
 * SECURITY: Authenticated file serving route.
 * - Requires a valid session
 * - Only serves files from the authenticated user's own upload directory
 * - Prevents path traversal via strict validation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // SECURITY: Rate limit file serving to prevent bandwidth exhaustion
    const rateLimitResult = checkRateLimit(_request, 'fileServing', RATE_LIMITS.fileServing);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pathSegments = (await params).path;

    // Expect exactly [userId, filename]
    if (!pathSegments || pathSegments.length !== 2) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const [requestedUserId, fileName] = pathSegments;

    // SECURITY: Only allow users to access their own files
    if (requestedUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SECURITY: Prevent path traversal — reject any segment containing ".." or "/"
    if (
      fileName.includes('..') ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      requestedUserId.includes('..') ||
      requestedUserId.includes('/') ||
      requestedUserId.includes('\\')
    ) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Build the absolute file path (uploads/ is outside public/)
    const filePath = path.join(process.cwd(), 'uploads', requestedUserId, fileName);

    // SECURITY: Verify the resolved path is within the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = getMimeType(ext);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // SECURITY: Use RFC 5987 encoding to prevent header injection via filename
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
