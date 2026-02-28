import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';
import { extractTextFromImage } from '@/lib/ai/ocr';

// 10MB max image size
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// OCR rate limit: 20 per hour (expensive AI operation)
const OCR_RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    // Check rate limit before auth
    const rateLimitResult = checkRateLimit(request, 'ocr', OCR_RATE_LIMIT);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'No image provided' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    // Validate image type
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        { success: false, message: `File type ${image.type} is not supported. Please upload a JPEG, PNG, GIF, or WebP image.` },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    // Validate size
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Image size exceeds 10MB limit' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    // Convert to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Extract text
    const result = await extractTextFromImage(base64, image.type);

    if (!result.text) {
      return NextResponse.json(
        {
          success: true,
          text: '',
          message: 'No text was found in the image.',
        },
        { headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    return NextResponse.json(
      { success: true, text: result.text },
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to extract text from image' },
      { status: 500 },
    );
  }
}
