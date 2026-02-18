'use client';

import { useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';

export function KeyboardShortcutsProvider() {
  const [helpOpen, setHelpOpen] = useState(false);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useKeyboardShortcuts(openHelp);

  return <KeyboardShortcutsHelp open={helpOpen} onClose={closeHelp} />;
}
