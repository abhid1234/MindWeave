import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ContentType } from '@/lib/db/schema';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export interface GenerateSummaryInput {
  title: string;
  body?: string | null | undefined;
  url?: string | null | undefined;
  type: ContentType;
}

/**
 * Generate a 1-2 sentence summary of content using Gemini Flash
 * Returns null if API key is not set or summarization fails
 */
export async function generateSummary(input: GenerateSummaryInput): Promise<string | null> {
  if (!genAI) {
    console.warn('Skipping summarization - GOOGLE_AI_API_KEY not set');
    return null;
  }

  // Don't summarize if there's not enough content
  const contentLength = (input.body || '').length;
  if (contentLength < 100) {
    return null;
  }

  try {
    const contentTypeDescription = {
      note: 'note',
      link: 'web article or link',
      file: 'file content',
    }[input.type];

    const prompt = `Summarize this ${contentTypeDescription} in 1-2 concise sentences (max 250 characters). Focus on the key takeaway or main point.

Title: ${input.title}
${input.body ? `Content: ${input.body.slice(0, 2000)}` : ''}
${input.url ? `URL: ${input.url}` : ''}

Summary:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      const summary = text.trim();
      // Ensure summary fits in the column (max 500 chars)
      return summary.slice(0, 500);
    }

    return null;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

/**
 * Regenerate summary for existing content
 * Used when content is updated
 */
export async function regenerateSummary(
  contentId: string,
  input: GenerateSummaryInput
): Promise<string | null> {
  return generateSummary(input);
}
