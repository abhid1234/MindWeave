'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface BrainDumpInputProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

const PLACEHOLDER = `Example: I need to research React Server Components for the project. Also, remind me to book flights for the conference in March. Had an interesting idea about using vector databases for our search feature - could improve relevance by 10x. Need to review the PR from Sarah about the auth refactor. Oh and I learned that PostgreSQL supports JSON indexing which could help with our metadata queries...`;

const MIN_CHARS = 50;
const MAX_CHARS = 10000;

export function BrainDumpInput({ onSubmit, isProcessing }: BrainDumpInputProps) {
  const [text, setText] = useState('');
  const charCount = text.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={isProcessing}
          rows={12}
          maxLength={MAX_CHARS}
          className="w-full rounded-lg border border-border bg-background p-4 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-y min-h-[200px]"
          aria-label="Brain dump text"
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            charCount > 0 && charCount < MIN_CHARS
              ? 'text-destructive'
              : charCount >= MAX_CHARS * 0.9
                ? 'text-amber-500'
                : 'text-muted-foreground'
          }`}
          data-testid="char-counter"
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          {charCount > 0 && charCount < MIN_CHARS && ` (${MIN_CHARS - charCount} more needed)`}
        </span>

        <button
          onClick={() => onSubmit(text)}
          disabled={!isValid || isProcessing}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          Process with AI
        </button>
      </div>
    </div>
  );
}
