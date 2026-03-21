import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferralDashboard } from './ReferralDashboard';

// Mock ShareButton component
vi.mock('@/components/growth/ShareButton', () => ({
  ShareButton: ({ url, title }: { url: string; title: string }) => (
    <button data-testid="share-button" data-url={url} data-title={title}>
      Share
    </button>
  ),
}));

// Mock navigator.clipboard
const writeTextMock = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
});

const defaultProps = {
  referralLink: 'https://mindweave.app/r/testuser',
  totalClicks: 42,
  totalSignups: 12,
  totalActivated: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReferralDashboard', () => {
  it('renders the referral link input', () => {
    render(<ReferralDashboard {...defaultProps} />);
    const input = screen.getByLabelText('Referral link');
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).value).toBe('https://mindweave.app/r/testuser');
  });

  it('renders all three stat cards with correct values', () => {
    render(<ReferralDashboard {...defaultProps} />);
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('Link Clicks')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('Signups')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Activated')).toBeDefined();
  });

  it('renders the ShareButton with correct props', () => {
    render(<ReferralDashboard {...defaultProps} />);
    const shareButton = screen.getByTestId('share-button');
    expect(shareButton.getAttribute('data-url')).toBe('https://mindweave.app/r/testuser');
    expect(shareButton.getAttribute('data-title')).toContain('Mindweave');
  });

  it('shows copy button and copies link to clipboard', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<ReferralDashboard {...defaultProps} />);

    const copyButton = screen.getByLabelText('Copy referral link');
    expect(copyButton).toBeDefined();

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('https://mindweave.app/r/testuser');
    });

    // Should show "Copied!" feedback
    expect(screen.getByText('Copied!')).toBeDefined();
  });

  it('renders with zero stats without errors', () => {
    render(
      <ReferralDashboard
        referralLink="https://mindweave.app/r/newuser"
        totalClicks={0}
        totalSignups={0}
        totalActivated={0}
      />
    );
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });
});
