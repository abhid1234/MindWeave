'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WrappedCard } from './WrappedCard';
import type { WrappedStats, WrappedCardVariant } from '@/types/wrapped';

const CARD_ORDER: WrappedCardVariant[] = ['overview', 'top-tags', 'streak', 'personality'];
const AUTO_ADVANCE_MS = 6000;

interface WrappedStoryViewProps {
  stats: WrappedStats;
  autoAdvance?: boolean;
}

export function WrappedStoryView({ stats, autoAdvance = true }: WrappedStoryViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < CARD_ORDER.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    if (!autoAdvance || isPaused || currentIndex >= CARD_ORDER.length - 1) return;

    const timer = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, autoAdvance, isPaused, goNext]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress dots */}
      <div className="mb-4 flex justify-center gap-2">
        {CARD_ORDER.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-8 bg-primary' : i < currentIndex ? 'w-2 bg-primary/60' : 'w-2 bg-muted-foreground/30'
            }`}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>

      {/* Card container */}
      <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-2xl shadow-xl">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {CARD_ORDER.map((variant) => (
            <div key={variant} className="h-full w-full flex-shrink-0">
              <WrappedCard stats={stats} variant={variant} />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {currentIndex < CARD_ORDER.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            aria-label="Next card"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
