import type { Metadata } from 'next';
import { Network } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SigmaGraph } from '@/components/graph/SigmaGraph';
import { ShareGraphButton } from '@/components/graph/ShareGraphButton';

export const metadata: Metadata = {
  title: 'Knowledge Graph | Mindweave',
  description: 'Visualize connections between your content',
};

export default async function GraphPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Knowledge Graph</h1>
              <p className="text-muted-foreground">
                Visualize connections between your content
              </p>
            </div>
          </div>
          <ShareGraphButton />
        </div>
      </div>

      {/* Graph */}
      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <SigmaGraph />
      </div>
    </div>
  );
}
