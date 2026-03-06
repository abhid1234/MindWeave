'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Wand2, ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { BrainDumpInput } from '@/components/brain-dump/BrainDumpInput';
import { StructuredNoteCard, type StructuredNoteData } from '@/components/brain-dump/StructuredNoteCard';
import { BeforeAfterView } from '@/components/brain-dump/BeforeAfterView';
import { processBrainDumpAction, saveBrainDumpNotesAction } from '@/app/actions/brain-dump';

type Phase = 'input' | 'processing' | 'review';

const PROCESSING_MESSAGES = [
  'Reading your thoughts...',
  'Identifying distinct ideas...',
  'Structuring notes...',
  'Generating tags...',
];

export default function BrainDumpPage() {
  const [phase, setPhase] = useState<Phase>('input');
  const [rawText, setRawText] = useState('');
  const [notes, setNotes] = useState<StructuredNoteData[]>([]);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleProcess = useCallback(async (text: string) => {
    setRawText(text);
    setPhase('processing');
    setError(null);

    // Rotate processing messages
    let msgIndex = 0;
    intervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % PROCESSING_MESSAGES.length;
      setProcessingMessage(PROCESSING_MESSAGES[msgIndex]);
    }, 1500);

    try {
      const result = await processBrainDumpAction(text);
      if (intervalRef.current) clearInterval(intervalRef.current);

      if (!result.success || !result.data) {
        setError(result.message);
        setPhase('input');
        return;
      }

      setNotes(result.data.notes);
      setPhase('review');
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setError('Failed to process brain dump. Please try again.');
      setPhase('input');
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveBrainDumpNotesAction({
        notes: notes.map((n) => ({
          title: n.title,
          body: n.body || undefined,
          tags: n.tags,
          actionItems: n.actionItems,
        })),
        sourceText: rawText,
      });

      if (!result.success) {
        setError(result.message);
        setIsSaving(false);
        return;
      }

      setSuccessMessage(result.message);
    } catch {
      setError('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [notes, rawText]);

  const handleRemoveNote = useCallback((index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateNote = useCallback((index: number, updated: StructuredNoteData) => {
    setNotes((prev) => prev.map((n, i) => (i === index ? updated : n)));
  }, []);

  const handleStartOver = useCallback(() => {
    setPhase('input');
    setRawText('');
    setNotes([]);
    setShowBeforeAfter(false);
    setError(null);
    setSuccessMessage(null);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brain Dump</h1>
        <p className="text-muted-foreground mt-1">
          Paste your messy thoughts and AI will transform them into structured notes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-center space-y-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{successMessage}</p>
          <button
            onClick={handleStartOver}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Wand2 className="h-4 w-4" />
            Process Another Brain Dump
          </button>
        </div>
      )}

      {/* Input Phase */}
      {phase === 'input' && !successMessage && (
        <BrainDumpInput onSubmit={handleProcess} isProcessing={false} />
      )}

      {/* Processing Phase */}
      {phase === 'processing' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4" data-testid="processing-state">
          <Wand2 className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {processingMessage}
          </p>
        </div>
      )}

      {/* Review Phase */}
      {phase === 'review' && !successMessage && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium">
              Extracted <span className="text-primary font-bold">{notes.length}</span> notes from your brain dump
            </p>
            <button
              onClick={() => setShowBeforeAfter(!showBeforeAfter)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showBeforeAfter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBeforeAfter ? 'Hide' : 'Show'} Before/After
            </button>
          </div>

          {/* Before/After toggle */}
          {showBeforeAfter && (
            <BeforeAfterView rawText={rawText} notes={notes} />
          )}

          {/* Notes grid */}
          {notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note, idx) => (
                <StructuredNoteCard
                  key={idx}
                  note={note}
                  index={idx}
                  onRemove={() => handleRemoveNote(idx)}
                  onUpdate={(updated) => handleUpdateNote(idx, updated)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">All notes removed. Start over?</p>
          )}

          {/* Bottom actions */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={handleStartOver}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Start Over
            </button>

            {notes.length > 0 && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : `Save All (${notes.length} notes)`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
