import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:test-url');
const mockRevokeObjectURL = vi.fn();
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = mockRevokeObjectURL;

describe('ExportDialog', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document.body for download link tests
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('should render dialog title', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Export Content')).toBeInTheDocument();
    });

    it('should show "all content" when no contentIds provided', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText(/export all content to a file/i)).toBeInTheDocument();
    });

    it('should show item count when contentIds provided', () => {
      render(<ExportDialog {...defaultProps} contentIds={['id1', 'id2', 'id3']} />);
      expect(screen.getByText(/export 3 selected items to a file/i)).toBeInTheDocument();
    });

    it('should use itemCount prop when provided', () => {
      render(
        <ExportDialog
          {...defaultProps}
          contentIds={['id1', 'id2', 'id3']}
          itemCount={5}
        />
      );
      expect(screen.getByText(/export 5 selected items to a file/i)).toBeInTheDocument();
    });

    it('should handle singular item correctly', () => {
      render(<ExportDialog {...defaultProps} contentIds={['id1']} />);
      expect(screen.getByText(/export 1 selected item to a file/i)).toBeInTheDocument();
    });
  });

  describe('Format Options', () => {
    it('should render JSON format option', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText(/machine-readable format/i)).toBeInTheDocument();
    });

    it('should render Markdown format option', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Markdown')).toBeInTheDocument();
      expect(screen.getByText(/human-readable format/i)).toBeInTheDocument();
    });

    it('should render CSV format option', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText(/spreadsheet format/i)).toBeInTheDocument();
    });

    it('should have JSON selected by default', () => {
      render(<ExportDialog {...defaultProps} />);
      const jsonOption = screen.getByText('JSON').closest('button');
      expect(jsonOption).toHaveClass('border-primary');
    });

    it('should highlight selected format', () => {
      render(<ExportDialog {...defaultProps} />);
      const markdownOption = screen.getByText('Markdown').closest('button');

      fireEvent.click(markdownOption!);

      expect(markdownOption).toHaveClass('border-primary');
    });
  });

  describe('Export Functionality', () => {
    it('should call fetch with correct parameters for JSON export', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="mindweave-export.json"',
        }),
        blob: () => Promise.resolve(new Blob(['{}'], { type: 'application/json' })),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentIds: undefined,
            format: 'json',
          }),
        });
      });
    });

    it('should call fetch with contentIds when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob(['{}'])),
      });

      render(<ExportDialog {...defaultProps} contentIds={['id1', 'id2']} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentIds: ['id1', 'id2'],
            format: 'json',
          }),
        });
      });
    });

    it('should call fetch with selected format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob([''])),
      });

      render(<ExportDialog {...defaultProps} />);

      // Select CSV format
      const csvOption = screen.getByText('CSV').closest('button');
      fireEvent.click(csvOption!);

      const exportBtn = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"format":"csv"'),
        });
      });
    });

    it('should create download link with blob URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="test-export.json"',
        }),
        blob: () => Promise.resolve(new Blob(['{"data": []}'])),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it('should close dialog on successful export', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob([''])),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should revoke object URL after download', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob([''])),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed export', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Export failed due to server error' }),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText('Export failed due to server error')).toBeInTheDocument();
      });
    });

    it('should display generic error message on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should not close dialog on export failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' }),
      });

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Loading State', () => {
    it('should show Exporting... while exporting', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            headers: new Headers(),
            blob: () => Promise.resolve(new Blob([''])),
          }), 100)
        )
      );

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should disable buttons while exporting', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            headers: new Headers(),
            blob: () => Promise.resolve(new Blob([''])),
          }), 100)
        )
      );

      render(<ExportDialog {...defaultProps} />);
      const exportBtn = screen.getByRole('button', { name: /export/i });

      fireEvent.click(exportBtn);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    it('should close dialog when Cancel is clicked', () => {
      render(<ExportDialog {...defaultProps} />);
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(cancelBtn);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
