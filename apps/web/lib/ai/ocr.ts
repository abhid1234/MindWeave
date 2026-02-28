import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface OcrResult {
  text: string;
}

/**
 * Extract text from an image using Gemini Vision (multimodal)
 */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<OcrResult> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}. Supported: ${SUPPORTED_MIME_TYPES.join(', ')}`);
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
    'Extract ALL text from this image. Preserve formatting and layout as much as possible. Output ONLY the extracted text, nothing else. If no text is found, respond with exactly: [NO_TEXT_FOUND]',
  ]);

  const text = result.response.text().trim();

  if (text === '[NO_TEXT_FOUND]') {
    return { text: '' };
  }

  return { text };
}
