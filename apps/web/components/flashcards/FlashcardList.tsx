'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardListProps {
  cards: FlashcardItem[];
}

export function FlashcardList({ cards }: FlashcardListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            className="w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent/50"
            onClick={() => setExpandedId(isExpanded ? null : card.id)}
          >
            <div className="flex items-start gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{card.question}</p>
                {isExpanded && (
                  <p className="text-sm text-muted-foreground mt-2">{card.answer}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
