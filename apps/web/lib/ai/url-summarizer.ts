import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedContent } from './url-content';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

export interface SummarizeUrlResult {
  summary: string;
  keyTakeaways: string[];
  formattedBody: string;
}

/**
 * Summarize extracted URL content using Gemini
 */
export async function summarizeUrlContent(
  content: ExtractedContent,
): Promise<SummarizeUrlResult> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  const sourceLabel =
    content.sourceType === 'youtube' ? 'YouTube video transcript' : 'web article';

  const prompt = `Analyze this ${sourceLabel} and provide a structured summary.

Title: ${content.title}
URL: ${content.url}

Content:
${content.text.slice(0, 8000)}

Respond in EXACTLY this format (no deviations):

SUMMARY:
[2-4 sentence summary of the main points]

KEY_TAKEAWAYS:
- [First key takeaway]
- [Second key takeaway]
- [Third key takeaway]
- [Fourth key takeaway, if applicable]
- [Fifth key takeaway, if applicable]

Keep takeaways concise (1 sentence each). Focus on actionable insights.`;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error('Empty response from AI');
  }

  // Parse the structured response
  const summaryMatch = text.match(/SUMMARY:\s*\n([\s\S]*?)(?=\nKEY_TAKEAWAYS:)/);
  const takeawaysMatch = text.match(/KEY_TAKEAWAYS:\s*\n([\s\S]*?)$/);

  const summary = summaryMatch?.[1]?.trim() || text.trim();
  const keyTakeaways = takeawaysMatch?.[1]
    ? takeawaysMatch[1]
        .split('\n')
        .map((line) => line.replace(/^-\s*/, '').trim())
        .filter((line) => line.length > 0)
    : [];

  // Build formatted markdown body
  const sourceLink =
    content.sourceType === 'youtube'
      ? `[${content.title}](${content.url})`
      : `[${content.title}](${content.url})`;

  const takeawaysList = keyTakeaways.map((t) => `- ${t}`).join('\n');

  const formattedBody = [
    '## Summary',
    '',
    summary,
    '',
    '## Key Takeaways',
    '',
    takeawaysList,
    '',
    '---',
    '',
    `*Source: ${sourceLink}*`,
  ].join('\n');

  return {
    summary,
    keyTakeaways,
    formattedBody,
  };
}
