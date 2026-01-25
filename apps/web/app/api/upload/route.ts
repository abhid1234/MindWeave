import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
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

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.txt',
  '.md',
  '.doc',
  '.docx',
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, message: `File type ${fileExtension} is not allowed` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      return NextResponse.json(
        { success: false, message: `MIME type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${uniqueId}-${safeFileName}`;

    // Create user-specific upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', session.user.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file info
    const publicPath = `/uploads/${session.user.id}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: file.name,
        filePath: publicPath,
        fileType: file.type || getMimeType(fileExtension),
        fileSize: file.size,
      },
    });
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
