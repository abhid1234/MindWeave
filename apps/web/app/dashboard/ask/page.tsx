import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { KnowledgeQA } from '@/components/search/KnowledgeQA';

export default async function AskPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ask Your Knowledge Base</h1>
        <p className="mt-2 text-muted-foreground">
          Ask questions about your saved notes, links, and files. Gemini AI will search through your knowledge base and provide answers with citations.
        </p>
      </div>

      <KnowledgeQA />

      <div className="mt-6 text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">Tips for better answers:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Be specific in your questions for more accurate results</li>
          <li>Reference topics or keywords you know are in your notes</li>
          <li>The more content you save, the more comprehensive answers you&apos;ll get</li>
        </ul>
      </div>
    </div>
  );
}
