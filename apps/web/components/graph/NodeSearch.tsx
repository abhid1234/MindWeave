'use client';

import { Search } from 'lucide-react';

type NodeSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function NodeSearch({ value, onChange }: NodeSearchProps) {
  return (
    <div className="relative" data-testid="node-search">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search nodes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        data-testid="node-search-input"
      />
    </div>
  );
}
