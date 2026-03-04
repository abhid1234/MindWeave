'use client';

import { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateFlashcardsAction } from '@/app/actions/flashcards';

interface GenerateFlashcardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
}

export function GenerateFlashcardsDialog({
  open,
  onOpenChange,
  contentId,
  contentTitle,
}: GenerateFlashcardsDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateFlashcardsAction({ contentId });
      if (result.success) {
        setGeneratedCount(result.count ?? 0);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setGeneratedCount(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            Generate Flashcards
          </DialogTitle>
          <DialogDescription>
            Generate AI study flashcards from &ldquo;{contentTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {generatedCount !== null ? (
          <div className="py-4 text-center space-y-4">
            <p className="text-lg font-medium">
              Generated {generatedCount} flashcard{generatedCount !== 1 ? 's' : ''}!
            </p>
            <Link href="/dashboard/study">
              <Button>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Go to Study
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This will use AI to generate 3-5 question &amp; answer cards from this content.
              Any existing flashcards for this content will be replaced.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
