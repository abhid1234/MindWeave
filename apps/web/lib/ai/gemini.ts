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

export interface GenerateLinkedInPostInput {
  content: Array<{
    title: string;
    body?: string;
    url?: string;
    type: 'note' | 'link' | 'file';
    tags: string[];
  }>;
  tone: 'professional' | 'casual' | 'storytelling';
  length: 'short' | 'medium' | 'long';
  includeHashtags: boolean;
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

export interface GenerateHighlightInsightInput {
  title: string;
  body?: string;
  tags: string[];
}

/**
 * Generate a short insight about why a piece of knowledge is worth revisiting
 */
export async function generateHighlightInsight(input: GenerateHighlightInsightInput): Promise<string> {
  if (!genAI) {
    return `"${input.title}" — a great piece to revisit today.`;
  }

  try {
    const prompt = `You are a knowledge coach. Given the following content from a user's personal knowledge base, write ONE short sentence (max 20 words) explaining why this knowledge is worth revisiting today. Be specific and insightful, not generic.

Title: ${input.title}
${input.body ? `Content: ${input.body.slice(0, 500)}` : ''}
Tags: ${input.tags.join(', ')}

Output ONLY the sentence, no quotes, no preamble.`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      return text.trim();
    }

    return `"${input.title}" — a great piece to revisit today.`;
  } catch (error) {
    console.error('Error generating highlight insight:', error);
    return `"${input.title}" — a great piece to revisit today.`;
  }
}

/**
 * Generate a LinkedIn post from user's knowledge base content using Gemini Flash
 */
export async function generateLinkedInPost(input: GenerateLinkedInPostInput): Promise<string> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  const toneInstructions: Record<string, string> = {
    professional:
      'Write in a professional, authoritative tone. Use clear, direct language. Include data-driven insights where possible. Position the author as a thought leader.',
    casual:
      'Write in a conversational, approachable tone. Use first person. Be relatable and authentic. Include personal reflections or opinions.',
    storytelling:
      'Write as a narrative. Start with a hook or anecdote. Build tension or curiosity. End with a takeaway or lesson learned.',
  };

  const lengthRanges: Record<string, string> = {
    short: '50-100 words (2-3 short paragraphs)',
    medium: '100-200 words (3-4 paragraphs)',
    long: '200-300 words (4-6 paragraphs)',
  };

  const contentText = input.content
    .map((item, idx) => {
      const body = item.body ? item.body.slice(0, 2000) : '';
      return `[${idx + 1}] Title: ${item.title}
Type: ${item.type}
${body ? `Content: ${body}` : ''}
${item.url ? `URL: ${item.url}` : ''}
Tags: ${item.tags.join(', ')}`;
    })
    .join('\n\n');

  const prompt = `You are a LinkedIn post writer. Generate a LinkedIn post based on the following knowledge base content.

${toneInstructions[input.tone]}

Target length: ${lengthRanges[input.length]}

${input.includeHashtags ? 'Include 3-5 relevant hashtags at the end of the post.' : 'Do NOT include any hashtags.'}

Source content:

${contentText}

Write the LinkedIn post now. Output ONLY the post text, no preamble, no explanation, no quotes around it.`;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (text) {
      return text.trim();
    }

    throw new Error('Empty response from AI');
  } catch (error) {
    console.error('Error generating LinkedIn post:', error);
    throw error;
  }
}
