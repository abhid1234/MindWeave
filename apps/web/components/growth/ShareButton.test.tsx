import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';

vi.mock('@/lib/analytics/tracker', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('lucide-react', () => ({
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
    'aria-label': ariaLabel,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    if (asChild) return <>{children}</>;
    return <div>{children}</div>;
  },
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
}));

const defaultProps = {
  url: 'https://example.com/page',
  title: 'Test Title',
};

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'open', {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('renders share button', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('shows dropdown options', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByText(/Share on X/i)).toBeInTheDocument();
    expect(screen.getByText(/Share on LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/Share on Reddit/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy Link/i)).toBeInTheDocument();
  });

  it('opens Twitter URL when Twitter option is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Share on X/i));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      expect.any(String)
    );
    expect(windowOpenSpy.mock.calls[0][0]).toContain(encodeURIComponent(defaultProps.url));
  });

  it('opens LinkedIn URL when LinkedIn option is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Share on LinkedIn/i));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing'),
      '_blank',
      expect.any(String)
    );
  });

  it('opens Reddit URL when Reddit option is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Share on Reddit/i));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('reddit.com/submit'),
      '_blank',
      expect.any(String)
    );
  });

  it('copies link to clipboard when Copy Link is clicked', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Copy Link/i));
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(defaultProps.url);
    });
  });

  it('shows Copied! feedback after copying', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Copy Link/i));
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('calls trackEvent when sharing', async () => {
    const { trackEvent } = await import('@/lib/analytics/tracker');
    vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText(/Share on X/i));
    expect(trackEvent).toHaveBeenCalledWith(
      'share_click',
      expect.objectContaining({ platform: 'twitter' })
    );
  });
});
