'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  duration: number;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppingRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognitionClass();

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setError(null);
    isStoppingRef.current = false;

    // Request microphone permission explicitly before starting speech recognition.
    // The Speech API doesn't always trigger the browser permission prompt on its own.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release the stream immediately — we just needed the permission grant
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setError(
        'Microphone access denied. Click the lock icon in your address bar, set Microphone to "Allow", then try again.',
      );
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      startTimeRef.current = Date.now();
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      setTranscript((prev) => {
        // Only append new final text (avoid duplicating previous final results)
        if (finalText) return finalText;
        return prev;
      });
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't treat aborted as an error (happens when we call stop())
      if (event.error === 'aborted') return;

      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Try speaking louder or check your microphone.',
        'audio-capture': 'No microphone found. Please connect a microphone and try again.',
        'not-allowed': 'Microphone access denied. Click the lock icon in your address bar, set Microphone to "Allow", then try again.',
        'network': 'Network error. Please check your connection and try again.',
        'service-not-available': 'Speech service unavailable. Please try again later.',
      };

      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
      clearDurationInterval();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      clearDurationInterval();

      // Calculate final duration
      if (startTimeRef.current) {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        startTimeRef.current = null;
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setError('Failed to start speech recognition');
      console.error('Speech recognition start error:', err);
    }
  }, [clearDurationInterval]);

  const stop = useCallback(() => {
    if (recognitionRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setError(null);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      clearDurationInterval();
    };
  }, [clearDurationInterval]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    duration,
    error,
    start,
    stop,
    reset,
  };
}
