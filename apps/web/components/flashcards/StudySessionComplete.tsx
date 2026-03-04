'use client';

import { CheckCircle, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StudySessionCompleteProps {
  onRefresh: () => void;
}

export function StudySessionComplete({ onRefresh }: StudySessionCompleteProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
      <p className="text-muted-foreground mb-6">
        You&apos;ve reviewed all your due flashcards. Come back later for more.
      </p>
      <Button onClick={onRefresh} variant="outline">
        <BrainCircuit className="mr-2 h-4 w-4" />
        Check for more
      </Button>
    </Card>
  );
}
