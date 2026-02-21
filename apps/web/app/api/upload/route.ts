import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import path from 'path';
import crypto from 'crypto';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import { isGCSConfigured, uploadToGCS } from '@/lib/storage';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types with their magic bytes signatures
// SECURITY: Validate actual file content, not just extension/MIME type
const FILE_SIGNATURES: Record<string, { magic: number[]; offset?: number }[]> = {
  '.pdf': [{ magic: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  '.jpg': [{ magic: [0xff, 0xd8, 0xff] }],
  '.jpeg': [{ magic: [0xff, 0xd8, 0xff] }],
  '.png': [{ magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  '.gif': [{ magic: [0x47, 0x49, 0x46, 0x38] }], // GIF8
  '.webp': [{ magic: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { magic: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  // Text files don't have magic bytes - validate they're UTF-8
  '.txt': [],
  '.md': [],
  // Office formats have complex signatures
  '.doc': [{ magic: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
  '.docx': [{ magic: [0x50, 0x4b, 0x03, 0x04] }], // ZIP signature
};

const ALLOWED_EXTENSIONS = Object.keys(FILE_SIGNATURES);

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * SECURITY: Verify file content matches expected type using magic bytes
 */
function verifyFileSignature(buffer: Buffer, extension: string): boolean {
  const signatures = FILE_SIGNATURES[extension];

  // Text files don't have magic bytes - check for valid UTF-8
  if (extension === '.txt' || extension === '.md') {
    try {
      const text = buffer.toString('utf8');
      // Check for null bytes which indicate binary content
      if (text.includes('\0')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  if (!signatures || signatures.length === 0) {
    return true; // No signature to check
  }

  // Special handling for WebP which has two separate magic sequences
  if (extension === '.webp') {
    const riff = signatures[0];
    const webp = signatures[1];
    const riffMatch = buffer.slice(0, riff.magic.length).equals(Buffer.from(riff.magic));
    const webpMatch = buffer.slice(webp.offset!, webp.offset! + webp.magic.length).equals(Buffer.from(webp.magic));
    return riffMatch && webpMatch;
  }

  // Check if file starts with expected magic bytes
  for (const sig of signatures) {
    const offset = sig.offset || 0;
    const slice = buffer.slice(offset, offset + sig.magic.length);
    if (slice.equals(Buffer.from(sig.magic))) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit BEFORE authentication to prevent DoS
    const rateLimitResult = checkRateLimit(request, 'upload', RATE_LIMITS.upload);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 10MB limit' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, message: `File type ${fileExtension} is not allowed` },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate MIME type (basic check)
    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      return NextResponse.json(
        { success: false, message: `MIME type ${file.type} is not allowed` },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Read file content for magic byte verification
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // SECURITY: Verify actual file content matches claimed type
    if (!verifyFileSignature(buffer, fileExtension)) {
      return NextResponse.json(
        { success: false, message: 'File content does not match file type' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Generate unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${uniqueId}-${safeFileName}`;

    let publicPath: string;

    if (isGCSConfigured()) {
      // Production: upload to Google Cloud Storage
      const objectPath = `uploads/${session.user.id}/${fileName}`;
      const contentType = file.type || getMimeType(path.extname(file.name).toLowerCase());
      publicPath = await uploadToGCS(objectPath, buffer, contentType);
    } else {
      // Dev fallback: write to local filesystem
      const { writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');

      const uploadDir = path.join(process.cwd(), 'uploads', session.user.id);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      publicPath = `/api/files/${session.user.id}/${fileName}`;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName: file.name,
          filePath: publicPath,
          fileType: file.type || getMimeType(fileExtension),
          fileSize: file.size,
        },
      },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload file' },
      { status: 500 }
    );
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
