'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { FlashcardViewer } from '@/components/flashcards/FlashcardViewer';
import { FlashcardStats } from '@/components/flashcards/FlashcardStats';
import { StudySessionComplete } from '@/components/flashcards/StudySessionComplete';
import { getDueFlashcardsAction, getStudyStatsAction } from '@/app/actions/flashcards';

export default function StudyPage() {
  const [cards, setCards] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    interval: string;
    contentTitle: string;
    contentId: string;
  }>>([]);
  const [stats, setStats] = useState<{
    totalCards: number;
    dueToday: number;
    reviewedToday: number;
    studyStreak: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsComplete(false);
    try {
      const [cardsResult, statsResult] = await Promise.all([
        getDueFlashcardsAction(),
        getStudyStatsAction(),
      ]);
      if (cardsResult.success) setCards(cardsResult.cards);
      if (statsResult.success && statsResult.stats) setStats(statsResult.stats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async () => {
    setIsComplete(true);
    // Refresh stats
    const statsResult = await getStudyStatsAction();
    if (statsResult.success && statsResult.stats) setStats(statsResult.stats);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Study</h1>
          <p className="text-sm text-muted-foreground">Review your AI-generated flashcards</p>
        </div>
      </div>

      {stats && (
        <FlashcardStats
          totalCards={stats.totalCards}
          dueToday={stats.dueToday}
          reviewedToday={stats.reviewedToday}
          studyStreak={stats.studyStreak}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isComplete ? (
        <StudySessionComplete onRefresh={loadData} />
      ) : cards.length > 0 ? (
        <FlashcardViewer cards={cards} onComplete={handleComplete} />
      ) : (
        <div className="text-center py-16 space-y-4">
          <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h2 className="text-lg font-medium">No flashcards yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Generate flashcards from your content by clicking the &ldquo;Generate Flashcards&rdquo; option in any content card&apos;s menu.
          </p>
        </div>
      )}
    </div>
  );
}
