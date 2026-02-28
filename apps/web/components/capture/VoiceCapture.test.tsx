import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceCapture } from './VoiceCapture';

// Mock the hook
const mockUseSpeechRecognition = {
  isSupported: true,
  isListening: false,
  transcript: '',
  interimTranscript: '',
  duration: 0,
  error: null as string | null,
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockUseSpeechRecognition,
}));

beforeEach(() => {
  mockUseSpeechRecognition.isSupported = true;
  mockUseSpeechRecognition.isListening = false;
  mockUseSpeechRecognition.transcript = '';
  mockUseSpeechRecognition.interimTranscript = '';
  mockUseSpeechRecognition.duration = 0;
  mockUseSpeechRecognition.error = null;
  mockUseSpeechRecognition.start.mockClear();
  mockUseSpeechRecognition.stop.mockClear();
  mockUseSpeechRecognition.reset.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VoiceCapture', () => {
  it('renders mic button when supported', () => {
    render(<VoiceCapture onTranscript={vi.fn()} />);
    expect(screen.getByRole('button', { name: /start voice capture/i })).toBeInTheDocument();
  });

  it('renders nothing when not supported', () => {
    mockUseSpeechRecognition.isSupported = false;
    const { container } = render(<VoiceCapture onTranscript={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('starts recording on click', async () => {
    const user = userEvent.setup();
    render(<VoiceCapture onTranscript={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /start voice capture/i }));
    expect(mockUseSpeechRecognition.reset).toHaveBeenCalled();
    expect(mockUseSpeechRecognition.start).toHaveBeenCalled();
  });

  it('shows recording state with duration', () => {
    mockUseSpeechRecognition.isListening = true;
    mockUseSpeechRecognition.duration = 45;

    render(<VoiceCapture onTranscript={vi.fn()} />);
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    expect(screen.getByText('0:45')).toBeInTheDocument();
  });

  it('shows error message', () => {
    mockUseSpeechRecognition.error = 'Microphone access denied.';
    render(<VoiceCapture onTranscript={vi.fn()} />);
    expect(screen.getByText('Microphone access denied.')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<VoiceCapture onTranscript={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
