'use client';

import { useState } from 'react';
import { Wand2, Loader2, RotateCcw, Check, X } from 'lucide-react';
import { refineContentAction } from '@/app/actions/refine';
import { updateContentAction } from '@/app/actions/content';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ContentRefineDialogProps = {
  contentId: string;
  contentBody: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefined: () => void;
};

type Tone = 'professional' | 'casual' | 'academic' | 'concise';

const toneOptions: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Clear & polished' },
  { value: 'casual', label: 'Casual', desc: 'Friendly & conversational' },
  { value: 'academic', label: 'Academic', desc: 'Formal & precise' },
  { value: 'concise', label: 'Concise', desc: 'Brief & direct' },
];

export function ContentRefineDialog({
  contentId,
  contentBody,
  open,
  onOpenChange,
  onRefined,
}: ContentRefineDialogProps) {
  const { addToast } = useToast();
  const [tone, setTone] = useState<Tone>('professional');
  const [customInstruction, setCustomInstruction] = useState('');
  const [refinedText, setRefinedText] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const result = await refineContentAction({
        contentId,
        tone,
        customInstruction: customInstruction.trim() || undefined,
      });

      if (result.success && result.refined) {
        setRefinedText(result.refined);
      } else {
        addToast({
          title: 'Refinement failed',
          description: result.message || 'Please try again.',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Refinement failed',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleApply = async () => {
    if (!refinedText) return;
    setIsApplying(true);
    try {
      const result = await updateContentAction({
        contentId,
        body: refinedText,
      });

      if (result.success) {
        addToast({
          title: 'Content refined',
          description: 'Your content has been updated with the refined version.',
        });
        onRefined();
        handleClose();
      } else {
        addToast({
          title: 'Failed to apply',
          description: result.message || 'Please try again.',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Failed to apply',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDiscard = () => {
    setRefinedText(null);
    setShowOriginal(false);
  };

  const handleClose = () => {
    setRefinedText(null);
    setCustomInstruction('');
    setShowOriginal(false);
    setTone('professional');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Refine with AI
          </DialogTitle>
          <DialogDescription>
            Transform your content with AI-powered refinement.
          </DialogDescription>
        </DialogHeader>

        {!refinedText ? (
          <div className="space-y-4">
            {/* Tone selector */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Tone</h3>
              <div className="grid grid-cols-2 gap-2">
                {toneOptions.map((option) => {
                  const isActive = tone === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      data-testid={`tone-${option.value}`}
                      className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom instruction */}
            <div>
              <label htmlFor="custom-instruction" className="mb-1 block text-sm font-medium">
                Custom instruction (optional)
              </label>
              <input
                id="custom-instruction"
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g., Use bullet points, add headers..."
                maxLength={200}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {customInstruction.length}/200
              </p>
            </div>

            {/* Preview of original */}
            <div>
              <h3 className="mb-1 text-sm font-medium">Original text</h3>
              <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-3 text-sm">
                {contentBody.slice(0, 500)}
                {contentBody.length > 500 && '...'}
              </div>
            </div>

            {/* Refine button */}
            <Button
              onClick={handleRefine}
              disabled={isRefining}
              className="w-full"
              data-testid="refine-button"
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Refine
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toggle between original and refined */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowOriginal(false)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  !showOriginal
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid="show-refined-tab"
              >
                Refined
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  showOriginal
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                data-testid="show-original-tab"
              >
                Original
              </button>
            </div>

            {/* Content display */}
            <div className="max-h-64 overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
              {showOriginal ? contentBody : refinedText}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1"
                data-testid="apply-button"
              >
                {isApplying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={handleRefine}
                disabled={isRefining}
                data-testid="try-again-button"
              >
                {isRefining ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={handleDiscard}
                data-testid="discard-button"
              >
                <X className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
