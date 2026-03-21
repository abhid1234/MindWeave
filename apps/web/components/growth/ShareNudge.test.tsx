import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareNudge } from './ShareNudge';

vi.mock('@/lib/analytics/tracker', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Share2: () => <svg data-testid="share2-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  ExternalLink: () => <svg data-testid="external-link-icon" />,
  Linkedin: () => <svg data-testid="linkedin-icon" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('./ShareButton', () => ({
  ShareButton: ({ url, title }: { url: string; title: string }) => (
    <button data-testid="share-button" data-url={url} data-title={title}>
      Share
    </button>
  ),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  title: 'My Great Post',
  url: 'https://example.com/post',
  actionType: 'created_til',
};

describe('ShareNudge', () => {
  it('renders when open is true', () => {
    render(<ShareNudge {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nice work!')).toBeInTheDocument();
    expect(screen.getByText('Share this with your network?')).toBeInTheDocument();
  });

  it('is not visible when open is false', () => {
    render(<ShareNudge {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Nice work!')).not.toBeInTheDocument();
  });

  it('renders ShareButton with correct props', () => {
    render(<ShareNudge {...defaultProps} />);
    const shareBtn = screen.getByTestId('share-button');
    expect(shareBtn).toHaveAttribute('data-url', defaultProps.url);
    expect(shareBtn).toHaveAttribute('data-title', defaultProps.title);
  });

  it('calls onClose when Maybe later is clicked', () => {
    const onClose = vi.fn();
    render(<ShareNudge {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Maybe later'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the title text in the dialog', () => {
    render(<ShareNudge {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
  });

  it('renders Sparkles icon', () => {
    render(<ShareNudge {...defaultProps} />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });
});
