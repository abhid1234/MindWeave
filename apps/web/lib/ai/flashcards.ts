import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

export interface FlashcardPair {
  question: string;
  answer: string;
}

interface GenerateFlashcardsInput {
  title: string;
  body?: string | null;
  tags?: string[];
  autoTags?: string[];
}

export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<FlashcardPair[]> {
  if (!genAI) return [];

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const bodyTruncated = input.body ? input.body.slice(0, 3000) : '';
    const allTags = [...(input.tags ?? []), ...(input.autoTags ?? [])];

    const prompt = `Generate 3-5 study flashcards (question and answer pairs) from the following content.
Each flashcard should test understanding of a key concept, fact, or insight from the content.
Questions should be clear and specific. Answers should be concise but complete.

Title: ${input.title}
${bodyTruncated ? `Content: ${bodyTruncated}` : ''}
${allTags.length > 0 ? `Topics: ${allTags.join(', ')}` : ''}

Return ONLY a valid JSON array of objects with "question" and "answer" fields. No markdown, no code blocks, no explanation.
Example: [{"question":"What is X?","answer":"X is..."}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item: unknown): item is FlashcardPair =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as FlashcardPair).question === 'string' &&
          typeof (item as FlashcardPair).answer === 'string' &&
          (item as FlashcardPair).question.length > 0 &&
          (item as FlashcardPair).answer.length > 0
      )
      .slice(0, 5);
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    return [];
  }
}
