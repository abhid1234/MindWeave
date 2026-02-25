import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickCaptureDialog } from './QuickCaptureDialog';
import * as contentActions from '@/app/actions/content';

// Mock server actions
vi.mock('@/app/actions/content', () => ({
  createContentAction: vi.fn(),
}));

// Mock toast
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe('QuickCaptureDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render dialog by default', () => {
    render(<QuickCaptureDialog />);
    expect(screen.queryByText('Quick Capture')).not.toBeInTheDocument();
  });

  it('should open dialog on Ctrl+N', () => {
    render(<QuickCaptureDialog />);

    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
    expect(screen.getByText('Quick Capture')).toBeInTheDocument();
  });

  it('should open dialog on Cmd+N', () => {
    render(<QuickCaptureDialog />);

    fireEvent.keyDown(document, { key: 'n', metaKey: true });
    expect(screen.getByText('Quick Capture')).toBeInTheDocument();
  });

  it('should close dialog on close button click', () => {
    render(<QuickCaptureDialog />);

    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
    expect(screen.getByText('Quick Capture')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('Quick Capture')).not.toBeInTheDocument();
  });

  it('should show type toggle with Note and Link', () => {
    render(<QuickCaptureDialog />);
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('should show URL field when Link type selected', () => {
    render(<QuickCaptureDialog />);
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

    fireEvent.click(screen.getByText('Link'));
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });

  it('should not show URL field for Note type', () => {
    render(<QuickCaptureDialog />);
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

    expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
  });

  it('should submit form and show success toast', async () => {
    vi.mocked(contentActions.createContentAction).mockResolvedValue({
      success: true,
      message: 'Content saved',
    });

    render(<QuickCaptureDialog />);
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

    const titleInput = screen.getByPlaceholderText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(contentActions.createContentAction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' })
      );
    });
  });

  it('should show error toast on failed submission', async () => {
    vi.mocked(contentActions.createContentAction).mockResolvedValue({
      success: false,
      message: 'Failed to save',
    });

    render(<QuickCaptureDialog />);
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' })
      );
    });
  });
});
