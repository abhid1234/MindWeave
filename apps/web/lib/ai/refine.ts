import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: 'Clear, polished, suitable for professional communication',
  casual: 'Friendly, conversational, easy to read',
  academic: 'Formal, precise, well-structured with clear arguments',
  concise: 'Brief, direct, removing all unnecessary words',
};

/**
 * Refine content text using Gemini AI with a specified tone
 */
export async function refineContent(input: {
  text: string;
  tone: string;
  customInstruction?: string;
}): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  const toneDescription = TONE_DESCRIPTIONS[input.tone] || input.tone;
  const customPart = input.customInstruction
    ? ` Additional instruction: ${input.customInstruction}.`
    : '';

  const prompt = `You are an expert editor. Rewrite the following text in a ${input.tone} tone (${toneDescription}).${customPart} Preserve all factual information and key points. Return ONLY the refined text, no explanations or preamble.

Text to refine:
"""
${input.text.slice(0, 50000)}
"""`;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Empty response from AI');
    }

    return text.trim();
  } catch (error) {
    console.error('Error refining content:', error);
    throw error;
  }
}
