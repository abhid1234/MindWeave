import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload, type UploadedFile } from './FileUpload';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FileUpload', () => {
  const mockOnFileUploaded = vi.fn();
  const mockOnFileRemoved = vi.fn();

  const mockUploadedFile: UploadedFile = {
    fileName: 'test.pdf',
    filePath: '/uploads/user123/abc123-test.pdf',
    fileType: 'application/pdf',
    fileSize: 1024 * 1024, // 1MB
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('rendering', () => {
    it('should render upload area when no file is uploaded', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      expect(screen.getByText(/click or drag file to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf, images, text files up to 10mb/i)).toBeInTheDocument();
    });

    it('should render uploaded file preview when file is provided', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={mockUploadedFile}
        />
      );

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });

    it('should render image preview for image files', () => {
      const imageFile: UploadedFile = {
        ...mockUploadedFile,
        fileName: 'test.jpg',
        filePath: '/uploads/user123/abc123-test.jpg',
        fileType: 'image/jpeg',
      };

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={imageFile}
        />
      );

      const img = screen.getByRole('img', { name: 'test.jpg' });
      expect(img).toBeInTheDocument();
      // Next.js Image component modifies src for optimization, so check alt instead
      expect(img).toHaveAttribute('alt', 'test.jpg');
    });

    it('should show disabled state', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
          disabled
        />
      );

      // The upload area should have disabled styling
      const uploadArea = screen.getByText(/click or drag file to upload/i).closest('div');
      expect(uploadArea?.parentElement).toHaveClass('opacity-50');
    });
  });

  describe('file upload', () => {
    it('should upload file via file input', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'File uploaded successfully',
          data: mockUploadedFile,
        }),
      });

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
          method: 'POST',
        }));
      });

      await waitFor(() => {
        expect(mockOnFileUploaded).toHaveBeenCalledWith(mockUploadedFile);
      });
    });

    it('should show uploading state', async () => {
      // Never resolve the fetch
      mockFetch.mockReturnValue(new Promise(() => {}));

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        // Look for the visible uploading text (not the sr-only one)
        const uploadingTexts = screen.getAllByText(/uploading/i);
        const visibleUploading = uploadingTexts.find(el => !el.closest('.sr-only'));
        expect(visibleUploading).toBeInTheDocument();
      });
    });

    it('should show error message on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          message: 'File size exceeds 10MB limit',
        }),
      });

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const file = new File(['test content'], 'large.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('File size exceeds 10MB limit')).toBeInTheDocument();
      });

      expect(mockOnFileUploaded).not.toHaveBeenCalled();
    });

    it('should show error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        // Look for the visible error text (not the sr-only one)
        const errorTexts = screen.getAllByText(/failed to upload file/i);
        const visibleError = errorTexts.find(el => !el.closest('.sr-only'));
        expect(visibleError).toBeInTheDocument();
      });
    });
  });

  describe('file removal', () => {
    it('should call onFileRemoved when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={mockUploadedFile}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove file/i });
      await user.click(removeButton);

      expect(mockOnFileRemoved).toHaveBeenCalled();
    });

    it('should not allow removal when disabled', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={mockUploadedFile}
          disabled
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove file/i });
      expect(removeButton).toBeDisabled();
    });
  });

  describe('drag and drop', () => {
    it('should highlight on drag over', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const dropZone = screen.getByText(/click or drag file to upload/i).closest('div')?.parentElement;

      fireEvent.dragOver(dropZone!);

      expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    });

    it('should reset highlight on drag leave', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const dropZone = screen.getByText(/click or drag file to upload/i).closest('div')?.parentElement;

      fireEvent.dragOver(dropZone!);
      expect(screen.getByText(/drop file here/i)).toBeInTheDocument();

      fireEvent.dragLeave(dropZone!);
      expect(screen.getByText(/click or drag file to upload/i)).toBeInTheDocument();
    });

    it('should upload file on drop', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'File uploaded successfully',
          data: mockUploadedFile,
        }),
      });

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
        />
      );

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByText(/click or drag file to upload/i).closest('div')?.parentElement;

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
          method: 'POST',
        }));
      });

      await waitFor(() => {
        expect(mockOnFileUploaded).toHaveBeenCalledWith(mockUploadedFile);
      });
    });

    it('should not highlight on drag when disabled', () => {
      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={null}
          disabled
        />
      );

      const dropZone = screen.getByText(/click or drag file to upload/i).closest('div')?.parentElement;

      fireEvent.dragOver(dropZone!);

      // Should still show default text, not "Drop file here"
      expect(screen.getByText(/click or drag file to upload/i)).toBeInTheDocument();
    });
  });

  describe('file size formatting', () => {
    it('should format bytes correctly', () => {
      const smallFile: UploadedFile = {
        ...mockUploadedFile,
        fileSize: 500, // 500 bytes
      };

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={smallFile}
        />
      );

      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      const kbFile: UploadedFile = {
        ...mockUploadedFile,
        fileSize: 1536, // 1.5 KB
      };

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={kbFile}
        />
      );

      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      const mbFile: UploadedFile = {
        ...mockUploadedFile,
        fileSize: 2.5 * 1024 * 1024, // 2.5 MB
      };

      render(
        <FileUpload
          onFileUploaded={mockOnFileUploaded}
          onFileRemoved={mockOnFileRemoved}
          uploadedFile={mbFile}
        />
      );

      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });
  });
});
