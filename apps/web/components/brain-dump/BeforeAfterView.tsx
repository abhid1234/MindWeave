'use client';

import type { StructuredNoteData } from './StructuredNoteCard';

interface BeforeAfterViewProps {
  rawText: string;
  notes: StructuredNoteData[];
}

export function BeforeAfterView({ rawText, notes }: BeforeAfterViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="before-after-view">
      {/* Before */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Before</h4>
        <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground leading-relaxed">
            {rawText}
          </pre>
        </div>
      </div>

      {/* After */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">After</h4>
        <div className="rounded-lg border border-border bg-background p-4 max-h-[400px] overflow-y-auto space-y-3">
          {notes.map((note, idx) => (
            <div key={idx} className="rounded-md border border-border/50 p-3 space-y-1.5">
              <h5 className="text-sm font-semibold">{note.title}</h5>
              {note.body && (
                <p className="text-xs text-muted-foreground line-clamp-2">{note.body}</p>
              )}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
