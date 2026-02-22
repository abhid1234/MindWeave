import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn('GOOGLE_AI_API_KEY is not set. AI features will be disabled.');
}

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

export interface GenerateTagsInput {
  title: string;
  body?: string;
  url?: string;
  type: 'note' | 'link' | 'file';
}

export interface AnswerQuestionInput {
  question: string;
  context: Array<{
    title: string;
    body?: string;
    tags: string[];
  }>;
}

/**
 * Generate relevant tags for content using Gemini Flash
 */
export async function generateTags(input: GenerateTagsInput): Promise<string[]> {
  if (!genAI) {
    console.warn('Skipping tag generation - GOOGLE_AI_API_KEY not set');
    return [];
  }

  try {
    const prompt = `Analyze this ${input.type} and suggest 3-5 relevant tags that would help organize and find it later.

Title: ${input.title}
${input.body ? `Content: ${input.body.slice(0, 1000)}` : ''}
${input.url ? `URL: ${input.url}` : ''}

Return only the tags as a comma-separated list, nothing else. Make tags:
- Concise (1-3 words)
- Specific to the content
- Useful for categorization
- Lowercase

Example format: machine learning, python, tutorial, data science`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      const tags = text
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);
      return tags;
    }

    return [];
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

/**
 * Answer a question based on the user's knowledge base using Gemini Flash
 */
export async function answerQuestion(input: AnswerQuestionInput): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  try {
    const contextText = input.context
      .map((item, idx) => {
        return `[${idx + 1}] ${item.title}
${item.body ? item.body.slice(0, 500) : ''}
Tags: ${item.tags.join(', ')}`;
      })
      .join('\n\n');

    const prompt = `You are a helpful assistant that answers questions based on the user's personal knowledge base.

Here are the most relevant items from their knowledge base:

${contextText}

User question: ${input.question}

Please answer the question using the information from the knowledge base. If the answer cannot be found in the knowledge base, say so clearly. Cite which items you used by their numbers [1], [2], etc.`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      return text;
    }

    return 'Sorry, I could not generate an answer.';
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
}

/**
 * Extract text from an image using Gemini Flash multimodal capabilities
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!genAI) {
    console.warn('Skipping image text extraction - GOOGLE_AI_API_KEY not set');
    return '';
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      },
      'Extract all text from this image. If there is no text, provide a detailed description of the image content.',
    ]);
    const text = result.response.text();

    if (text) {
      return text;
    }

    return '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return '';
  }
}

/**
 * Summarize a piece of content using Gemini Flash
 */
export async function summarizeContent(text: string): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(
      `Summarize this content in 2-3 sentences:\n\n${text.slice(0, 4000)}`
    );
    const responseText = result.response.text();

    if (responseText) {
      return responseText;
    }

    return '';
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
