import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY is not set. AI features will be disabled.');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
 * Generate relevant tags for content using Claude
 */
export async function generateTags(input: GenerateTagsInput): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Skipping tag generation - ANTHROPIC_API_KEY not set');
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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const tags = content.text
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
 * Answer a question based on the user's knowledge base
 */
export async function answerQuestion(input: AnswerQuestionInput): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'Sorry, I could not generate an answer.';
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
}

/**
 * Summarize a piece of content
 */
export async function summarizeContent(text: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Summarize this content in 2-3 sentences:\n\n${text.slice(0, 4000)}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return '';
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
