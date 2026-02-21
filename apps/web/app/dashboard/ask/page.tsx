import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { KnowledgeQA } from '@/components/search/KnowledgeQA';
import { MessageCircleQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Ask | Mindweave',
  description: 'Ask questions and get AI-powered answers from your knowledge base',
};

export default async function AskPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ask Your Knowledge Base</h1>
            <p className="text-muted-foreground">
              Ask questions about your saved notes, links, and files. Gemini AI will search through your knowledge base and provide answers with citations.
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <KnowledgeQA />
      </div>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Tips for better answers</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Be specific in your questions for more accurate results</li>
              <li>Reference topics or keywords you know are in your notes</li>
              <li>The more content you save, the more comprehensive answers you&apos;ll get</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
