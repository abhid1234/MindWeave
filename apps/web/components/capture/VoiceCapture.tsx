'use client';

import { useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export interface VoiceCaptureProps {
  onTranscript: (text: string, duration: number) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceCapture({ onTranscript, disabled = false }: VoiceCaptureProps) {
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    duration,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition();

  const handleToggle = useCallback(() => {
    if (isListening) {
      stop();
      // Deliver transcript on stop (use timeout to allow final onend processing)
      setTimeout(() => {
        const finalText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
        if (finalText.trim()) {
          onTranscript(finalText.trim(), duration);
        }
        reset();
      }, 100);
    } else {
      reset();
      start();
    }
  }, [isListening, stop, start, reset, transcript, interimTranscript, duration, onTranscript]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={isListening ? 'Stop recording' : 'Start voice capture'}
        className="gap-1.5"
      >
        {isListening ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="text-xs font-mono">{formatDuration(duration)}</span>
            <MicOff className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            <span className="text-xs">Voice</span>
          </>
        )}
      </Button>

      {isListening && interimTranscript && (
        <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
          {interimTranscript}
        </span>
      )}

      {error && (
        <span className="flex items-center gap-1.5 text-xs text-destructive max-w-[320px]">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
