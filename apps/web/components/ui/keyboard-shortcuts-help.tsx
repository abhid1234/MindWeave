'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { shortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex gap-1">
        {shortcut.key.split('+').map((k) => (
          <kbd
            key={k}
            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 text-xs font-medium text-muted-foreground"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const general = shortcuts.filter((s) => s.category === 'General');
  const navigation = shortcuts.filter((s) => s.category === 'Navigation');

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Keyboard shortcuts">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        className="fixed left-1/2 top-[20%] z-[101] w-full max-w-md -translate-x-1/2 rounded-xl border bg-popover shadow-soft-lg overflow-hidden animate-scale-in"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
          {/* General */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">General</h3>
            <div className="divide-y divide-border">
              {general.map((s) => (
                <ShortcutRow key={s.key} shortcut={s} />
              ))}
            </div>
          </div>
          {/* Navigation */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Navigation</h3>
            <div className="divide-y divide-border">
              {navigation.map((s) => (
                <ShortcutRow key={s.key} shortcut={s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
