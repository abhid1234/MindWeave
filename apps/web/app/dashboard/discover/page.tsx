import type { Metadata } from 'next';
import { Compass } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ActivityRecommendations } from '@/components/discover/ActivityRecommendations';
import { UnexploredTopics } from '@/components/discover/UnexploredTopics';
import { RediscoverContent } from '@/components/discover/RediscoverContent';
import { SmartCollections } from '@/components/discover/SmartCollections';

export const metadata: Metadata = {
  title: 'Discover | Mindweave',
  description: 'Explore your knowledge base with personalized recommendations',
};

export default async function DiscoverPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Discover</h1>
            <p className="text-muted-foreground">
              Explore your knowledge base with personalized recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
          <ActivityRecommendations />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          <UnexploredTopics />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '225ms', animationFillMode: 'backwards' }}>
          <RediscoverContent />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
          <SmartCollections />
        </div>
      </div>
    </div>
  );
}
