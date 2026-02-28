import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

// Track the latest mock instance created by the constructor
let mockInstance: MockSpeechRecognition;

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 1;

  onstart: ((ev: Event) => void) | null = null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: ((ev: Event) => void) | null = null;

  start = vi.fn(() => {
    if (this.onstart) this.onstart(new Event('start'));
  });

  stop = vi.fn(() => {
    if (this.onend) this.onend(new Event('end'));
  });

  abort = vi.fn();

  constructor() {
    // Track latest instance so tests can access event handlers
    mockInstance = this;
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition = MockSpeechRecognition;
});

afterEach(() => {
  vi.useRealTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).webkitSpeechRecognition;
});

describe('useSpeechRecognition', () => {
  it('detects browser support', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it('detects lack of support when API is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
  });

  it('detects webkitSpeechRecognition fallback', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts listening', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    expect(result.current.isListening).toBe(true);
    expect(mockInstance.continuous).toBe(true);
    expect(mockInstance.interimResults).toBe(true);
  });

  it('stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stop();
    });
    expect(result.current.isListening).toBe(false);
  });

  it('accumulates transcript from results', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    act(() => {
      const mockEvent = {
        results: {
          length: 1,
          0: {
            isFinal: true,
            0: { transcript: 'Hello world', confidence: 0.95 },
            length: 1,
          },
        },
        resultIndex: 0,
      } as unknown as SpeechRecognitionEvent;

      mockInstance.onresult?.(mockEvent);
    });

    expect(result.current.transcript).toBe('Hello world');
  });

  it('tracks interim transcript separately', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    act(() => {
      const mockEvent = {
        results: {
          length: 1,
          0: {
            isFinal: false,
            0: { transcript: 'Hel', confidence: 0.5 },
            length: 1,
          },
        },
        resultIndex: 0,
      } as unknown as SpeechRecognitionEvent;

      mockInstance.onresult?.(mockEvent);
    });

    expect(result.current.interimTranscript).toBe('Hel');
  });

  it('tracks duration while listening', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.duration).toBe(3);
  });

  it('handles errors', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    act(() => {
      const errorEvent = {
        error: 'not-allowed',
        message: '',
      } as SpeechRecognitionErrorEvent;
      mockInstance.onerror?.(errorEvent);
    });

    expect(result.current.error).toBe('Microphone access denied. Please allow microphone access.');
    expect(result.current.isListening).toBe(false);
  });

  it('resets all state', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    act(() => {
      const mockEvent = {
        results: {
          length: 1,
          0: {
            isFinal: true,
            0: { transcript: 'Some text', confidence: 0.9 },
            length: 1,
          },
        },
        resultIndex: 0,
      } as unknown as SpeechRecognitionEvent;
      mockInstance.onresult?.(mockEvent);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isListening).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    // Unmount should not throw - recognition should be cleaned up
    unmount();
    expect(mockInstance.abort).toHaveBeenCalled();
  });
});
