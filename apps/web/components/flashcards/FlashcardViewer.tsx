'use client';

import { useState } from 'react';
import { RotateCcw, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { rateFlashcardAction } from '@/app/actions/flashcards';
import { useToast } from '@/components/ui/toast';

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  interval: string;
  contentTitle: string;
}

interface FlashcardViewerProps {
  cards: FlashcardData[];
  onComplete: () => void;
}

export function FlashcardViewer({ cards, onComplete }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const { addToast } = useToast();

  const card = cards[currentIndex];
  if (!card) return null;

  const progress = ((currentIndex) / cards.length) * 100;

  const handleRate = async (rating: 'easy' | 'hard' | 'again') => {
    setIsRating(true);
    try {
      const result = await rateFlashcardAction({ cardId: card.id, rating });
      if (!result.success) {
        addToast({ variant: 'error', title: result.message });
        return;
      }
      if (result.newBadges && result.newBadges.length > 0) {
        addToast({ variant: 'success', title: 'New badge unlocked!' });
      }
    } catch {
      addToast({ variant: 'error', title: 'Failed to rate card' });
    } finally {
      setIsRating(false);
    }

    setIsFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      onComplete();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span className="text-xs">{card.contentTitle}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentIndex}
            aria-valuemin={0}
            aria-valuemax={cards.length}
          />
        </div>
      </div>

      {/* Flashcard */}
      <Card
        className="min-h-[300px] flex flex-col items-center justify-center p-8 cursor-pointer select-none"
        onClick={() => !isFlipped && setIsFlipped(true)}
        data-testid="flashcard"
      >
        {!isFlipped ? (
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">{card.question}</p>
            <p className="text-sm text-muted-foreground">Click to reveal answer</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Answer</p>
            <p className="text-lg">{card.answer}</p>
          </div>
        )}
      </Card>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-3" data-testid="rating-buttons">
          <Button
            variant="outline"
            onClick={() => handleRate('again')}
            disabled={isRating}
            className="flex-1 max-w-[140px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Again
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRate('hard')}
            disabled={isRating}
            className="flex-1 max-w-[140px] border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Hard
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRate('easy')}
            disabled={isRating}
            className="flex-1 max-w-[140px] border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
          >
            <Check className="mr-2 h-4 w-4" />
            Easy
          </Button>
        </div>
      )}
    </div>
  );
}
