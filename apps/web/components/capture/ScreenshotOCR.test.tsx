import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenshotOCR } from './ScreenshotOCR';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ScreenshotOCR', () => {
  it('renders upload zone', () => {
    render(<ScreenshotOCR onTextExtracted={vi.fn()} />);
    expect(screen.getByText('Upload image for OCR')).toBeInTheDocument();
  });

  it('shows error for non-image files', async () => {
    render(<ScreenshotOCR onTextExtracted={vi.fn()} />);

    const input = screen.getByTestId('ocr-file-input');
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });

    // Use fireEvent directly since userEvent.upload respects accept attribute
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Please upload a JPEG, PNG, GIF, or WebP/)).toBeInTheDocument();
  });

  it('shows image preview after upload', async () => {
    const user = userEvent.setup();
    render(<ScreenshotOCR onTextExtracted={vi.fn()} />);

    const input = screen.getByTestId('ocr-file-input');
    const file = new File(['fake-png'], 'screenshot.png', { type: 'image/png' });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('screenshot.png')).toBeInTheDocument();
    });
    expect(screen.getByText('Extract Text (OCR)')).toBeInTheDocument();
  });

  it('calls onTextExtracted on successful extraction', async () => {
    const mockCallback = vi.fn();
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, text: 'Extracted content' }),
    });

    render(<ScreenshotOCR onTextExtracted={mockCallback} />);

    const input = screen.getByTestId('ocr-file-input');
    const file = new File(['fake-png'], 'screenshot.png', { type: 'image/png' });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Extract Text (OCR)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Extract Text (OCR)'));

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith('Extracted content');
    });
  });

  it('shows error on extraction failure', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, message: 'API error' }),
    });

    render(<ScreenshotOCR onTextExtracted={vi.fn()} />);

    const input = screen.getByTestId('ocr-file-input');
    const file = new File(['fake-png'], 'screenshot.png', { type: 'image/png' });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Extract Text (OCR)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Extract Text (OCR)'));

    await waitFor(() => {
      expect(screen.getByText('API error')).toBeInTheDocument();
    });
  });

  it('can remove selected image', async () => {
    const user = userEvent.setup();
    render(<ScreenshotOCR onTextExtracted={vi.fn()} />);

    const input = screen.getByTestId('ocr-file-input');
    const file = new File(['fake-png'], 'screenshot.png', { type: 'image/png' });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('screenshot.png')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /remove image/i }));
    expect(screen.getByText('Upload image for OCR')).toBeInTheDocument();
  });
});
