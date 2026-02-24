import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportFileUpload } from './ImportFileUpload';
import type { ImportSource } from '@/lib/import/types';

// Mock @/lib/import/types
vi.mock('@/lib/import/types', () => ({
  getImportSource: vi.fn((id: string) => {
    const sources: Record<string, any> = {
      bookmarks: {
        id: 'bookmarks',
        name: 'Browser Bookmarks',
        description: 'Import bookmarks from Chrome, Firefox, Safari, or Edge',
        acceptedExtensions: ['.html', '.htm'],
        acceptedMimeTypes: ['text/html'],
        maxFileSize: 50 * 1024 * 1024,
        icon: 'Bookmark',
      },
      notion: {
        id: 'notion',
        name: 'Notion',
        description: 'Import pages from Notion (ZIP export)',
        acceptedExtensions: ['.zip'],
        acceptedMimeTypes: ['application/zip'],
        maxFileSize: 100 * 1024 * 1024,
        icon: 'FileText',
      },
    };
    return sources[id];
  }),
}));

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('ImportFileUpload', () => {
  const defaultProps = {
    source: 'bookmarks' as ImportSource,
    onFileSelect: vi.fn(),
    selectedFile: null as File | null,
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dropzone/file input area when no file is selected', () => {
      render(<ImportFileUpload {...defaultProps} />);

      expect(screen.getByText(/drag and drop or click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/accepted formats/i)).toBeInTheDocument();
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('should display accepted file extensions from source config', () => {
      render(<ImportFileUpload {...defaultProps} />);

      expect(screen.getByText(/\.html, \.htm/)).toBeInTheDocument();
    });

    it('should display max file size from source config', () => {
      render(<ImportFileUpload {...defaultProps} />);

      expect(screen.getByText(/max file size/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should show file info (name, size) when a file is selected', () => {
      const file = new File(['hello world content'], 'bookmarks.html', { type: 'text/html' });
      Object.defineProperty(file, 'size', { value: 2048 });

      render(<ImportFileUpload {...defaultProps} selectedFile={file} />);

      expect(screen.getByText('bookmarks.html')).toBeInTheDocument();
      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    it('should call onFileSelect when a file is chosen via file input', async () => {
      const user = userEvent.setup();
      render(<ImportFileUpload {...defaultProps} />);

      const file = new File(['<html></html>'], 'bookmarks.html', { type: 'text/html' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('Clear Button', () => {
    it('should call onClear when the remove button is clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['content'], 'bookmarks.html', { type: 'text/html' });

      render(<ImportFileUpload {...defaultProps} selectedFile={file} />);

      const removeButton = screen.getByRole('button', { name: /remove file/i });
      await user.click(removeButton);

      expect(defaultProps.onClear).toHaveBeenCalled();
    });

    it('should render the remove button when a file is selected', () => {
      const file = new File(['content'], 'bookmarks.html', { type: 'text/html' });

      render(<ImportFileUpload {...defaultProps} selectedFile={file} />);

      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error prop is provided', () => {
      render(<ImportFileUpload {...defaultProps} error="Invalid file format" />);

      expect(screen.getByText('Invalid file format')).toBeInTheDocument();
    });

    it('should not display error when error prop is null', () => {
      render(<ImportFileUpload {...defaultProps} error={null} />);

      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable the file input when disabled prop is true', () => {
      render(<ImportFileUpload {...defaultProps} disabled />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it('should disable the remove button when disabled and file selected', () => {
      const file = new File(['content'], 'bookmarks.html', { type: 'text/html' });

      render(<ImportFileUpload {...defaultProps} selectedFile={file} disabled />);

      const removeButton = screen.getByRole('button', { name: /remove file/i });
      expect(removeButton).toBeDisabled();
    });

    it('should apply disabled styling to the dropzone', () => {
      render(<ImportFileUpload {...defaultProps} disabled />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label');
      expect(label).toHaveClass('cursor-not-allowed');
      expect(label).toHaveClass('opacity-50');
    });
  });

  describe('Drag and Drop', () => {
    it('should show drag state text on dragOver', () => {
      render(<ImportFileUpload {...defaultProps} />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      fireEvent.dragOver(label);

      expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    });

    it('should reset drag state on dragLeave', () => {
      render(<ImportFileUpload {...defaultProps} />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      fireEvent.dragOver(label);
      expect(screen.getByText(/drop file here/i)).toBeInTheDocument();

      fireEvent.dragLeave(label);
      expect(screen.getByText(/drag and drop or click to upload/i)).toBeInTheDocument();
    });

    it('should not show drag state when disabled', () => {
      render(<ImportFileUpload {...defaultProps} disabled />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      fireEvent.dragOver(label);

      // Should still show default text, not "Drop file here"
      expect(screen.getByText(/drag and drop or click to upload/i)).toBeInTheDocument();
    });

    it('should call onFileSelect on valid file drop', () => {
      render(<ImportFileUpload {...defaultProps} />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      const file = new File(['<html></html>'], 'bookmarks.html', { type: 'text/html' });

      fireEvent.drop(label, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file);
    });

    it('should not call onFileSelect on drop when disabled', () => {
      render(<ImportFileUpload {...defaultProps} disabled />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      const file = new File(['<html></html>'], 'bookmarks.html', { type: 'text/html' });

      fireEvent.drop(label, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(defaultProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('should not call onFileSelect when dropped file has invalid extension', () => {
      render(<ImportFileUpload {...defaultProps} />);

      const label = screen.getByText(/drag and drop or click to upload/i).closest('label')!;
      const file = new File(['invalid content'], 'data.csv', { type: 'text/csv' });

      fireEvent.drop(label, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(defaultProps.onFileSelect).not.toHaveBeenCalled();
    });
  });
});
