import React from 'react';

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
