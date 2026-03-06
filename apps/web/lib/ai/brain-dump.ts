import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-2.0-flash';

export interface StructuredNote {
  title: string;
  body: string;
  tags: string[];
  actionItems: string[];
}

export interface BrainDumpResult {
  notes: StructuredNote[];
  summary: string;
}

/**
 * Process a raw brain dump text into structured notes using Gemini AI
 */
export async function processBrainDump(input: { rawText: string }): Promise<BrainDumpResult> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  const prompt = `You are a knowledge organization expert. The user has written a brain dump — a messy stream of consciousness containing multiple ideas, thoughts, and notes mixed together.

Your job is to extract and structure these into distinct, well-organized notes.

Brain dump text:
"""
${input.rawText.slice(0, 10000)}
"""

Instructions:
1. Extract 2-8 distinct notes from the brain dump
2. Each note should cover ONE distinct idea or topic
3. Preserve ALL information — do not drop any details
4. Format note bodies in markdown (use headers, lists, bold where appropriate)
5. Generate 2-5 lowercase tags per note
6. Extract any action items or TODOs mentioned
7. Write clear, concise titles (max 80 characters)

Return ONLY valid JSON in this exact format (no markdown code fences, no explanation):
{
  "notes": [
    {
      "title": "Note title here",
      "body": "Markdown formatted body here",
      "tags": ["tag1", "tag2"],
      "actionItems": ["Action item 1", "Action item 2"]
    }
  ],
  "summary": "One-line summary of what was extracted"
}`;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Handle JSON that may be wrapped in code fences
    const jsonText = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    const parsed = JSON.parse(jsonText) as BrainDumpResult;

    // Validate the structure
    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) {
      throw new Error('AI returned no notes');
    }

    // Sanitize and normalize each note
    const notes: StructuredNote[] = parsed.notes.slice(0, 8).map((note) => ({
      title: String(note.title || 'Untitled Note').slice(0, 80),
      body: String(note.body || ''),
      tags: Array.isArray(note.tags)
        ? note.tags.map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 5)
        : [],
      actionItems: Array.isArray(note.actionItems)
        ? note.actionItems.map((a: unknown) => String(a).trim()).filter(Boolean)
        : [],
    }));

    return {
      notes,
      summary: String(parsed.summary || `Extracted ${notes.length} notes from your brain dump`),
    };
  } catch (error) {
    console.error('Error processing brain dump:', error);
    throw error;
  }
}
