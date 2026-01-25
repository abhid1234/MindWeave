import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareDialog } from './ShareDialog';
import * as contentActions from '@/app/actions/content';

// Mock server actions
vi.mock('@/app/actions/content', () => ({
  shareContentAction: vi.fn(),
  unshareContentAction: vi.fn(),
}));

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('ShareDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnShareStatusChange = vi.fn();

  const defaultProps = {
    contentId: 'test-content-id',
    contentTitle: 'Test Content Title',
    isShared: false,
    shareId: null,
    open: true,
    onOpenChange: mockOnOpenChange,
    onShareStatusChange: mockOnShareStatusChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Rendering', () => {
    it('should render dialog title', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByText('Share Content')).toBeInTheDocument();
    });

    it('should display content title', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByText('Test Content Title')).toBeInTheDocument();
    });

    it('should show Private status when not shared', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByText(/private - only you can view/i)).toBeInTheDocument();
    });

    it('should show Public status when shared', () => {
      render(
        <ShareDialog
          {...defaultProps}
          isShared={true}
          shareId="share-123"
        />
      );
      expect(screen.getByText(/public - anyone with link can view/i)).toBeInTheDocument();
    });

    it('should show Create Shareable Link button when not shared', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create shareable link/i })).toBeInTheDocument();
    });
  });

  describe('Share Flow', () => {
    it('should call shareContentAction when creating share link', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      } as any);

      render(<ShareDialog {...defaultProps} />);
      const shareButton = screen.getByRole('button', { name: /create shareable link/i });

      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(contentActions.shareContentAction).toHaveBeenCalledWith('test-content-id');
      });
    });

    it('should display share URL after successful share', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      } as any);

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue(/http:\/\/localhost:3000\/share\/abc123/)).toBeInTheDocument();
      });
    });

    it('should call onShareStatusChange with new status', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(mockOnShareStatusChange).toHaveBeenCalledWith(true, 'abc123');
      });
    });

    it('should display error message on share failure', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: false,
        message: 'Failed to share content',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to share content')).toBeInTheDocument();
      });
    });
  });

  describe('Unshare Flow', () => {
    it('should show Stop Sharing button when content is shared', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
      });
    });

    it('should call unshareContentAction when Stop Sharing is clicked', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });
      vi.mocked(contentActions.unshareContentAction).mockResolvedValue({
        success: true,
        message: 'Content is now private',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /stop sharing/i }));

      await waitFor(() => {
        expect(contentActions.unshareContentAction).toHaveBeenCalledWith('test-content-id');
      });
    });

    it('should update status to private after unsharing', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });
      vi.mocked(contentActions.unshareContentAction).mockResolvedValue({
        success: true,
        message: 'Content is now private',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop sharing/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /stop sharing/i }));

      await waitFor(() => {
        expect(mockOnShareStatusChange).toHaveBeenCalledWith(false, null);
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy URL to clipboard when copy button is clicked', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue(/http:\/\/localhost:3000\/share\/abc123/)).toBeInTheDocument();
      });

      // Find and click the copy button (it's the one with Copy icon)
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.querySelector('svg'));
      if (copyButton) {
        fireEvent.click(copyButton);
      }

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/share/abc123');
      });
    });
  });

  describe('Loading States', () => {
    it('should complete share action successfully', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/test123',
        shareId: 'test123',
      });

      render(<ShareDialog {...defaultProps} />);
      const button = screen.getByRole('button', { name: /create shareable link/i });
      fireEvent.click(button);

      // After the action completes, the share URL should be displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue(/http:\/\/localhost:3000\/share\/test123/)).toBeInTheDocument();
      });
    });
  });

  describe('Open Link', () => {
    it('should render Open Link button with correct href', async () => {
      vi.mocked(contentActions.shareContentAction).mockResolvedValue({
        success: true,
        message: 'Shared',
        shareUrl: 'http://localhost:3000/share/abc123',
        shareId: 'abc123',
      });

      render(<ShareDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create shareable link/i }));

      await waitFor(() => {
        const openLink = screen.getByRole('link', { name: /open link/i });
        expect(openLink).toHaveAttribute('href', 'http://localhost:3000/share/abc123');
        expect(openLink).toHaveAttribute('target', '_blank');
      });
    });
  });
});
