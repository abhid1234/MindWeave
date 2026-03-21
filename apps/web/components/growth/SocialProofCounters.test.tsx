import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialProofCounters } from './SocialProofCounters';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="icon-book-open" />,
  Library: () => <svg data-testid="icon-library" />,
  FileText: () => <svg data-testid="icon-file-text" />,
  Users: () => <svg data-testid="icon-users" />,
}));

describe('SocialProofCounters', () => {
  const defaultProps = {
    tilCount: 1234,
    collectionCount: 567,
    noteCount: 89012,
    userCount: 3456,
  };

  it('renders all four counters', () => {
    render(<SocialProofCounters {...defaultProps} />);
    expect(screen.getByText('TILs Published')).toBeInTheDocument();
    expect(screen.getByText('Collections Shared')).toBeInTheDocument();
    expect(screen.getByText('Notes Captured')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Builders')).toBeInTheDocument();
  });

  it('displays formatted numbers with toLocaleString', () => {
    render(<SocialProofCounters {...defaultProps} />);
    // Numbers should be formatted (locale-specific, but at least present as strings)
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText((567).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText((89012).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText((3456).toLocaleString())).toBeInTheDocument();
  });

  it('renders all icons', () => {
    render(<SocialProofCounters {...defaultProps} />);
    expect(screen.getByTestId('icon-book-open')).toBeInTheDocument();
    expect(screen.getByTestId('icon-library')).toBeInTheDocument();
    expect(screen.getByTestId('icon-file-text')).toBeInTheDocument();
    expect(screen.getByTestId('icon-users')).toBeInTheDocument();
  });

  it('renders zero values correctly', () => {
    render(<SocialProofCounters tilCount={0} collectionCount={0} noteCount={0} userCount={0} />);
    // All 4 counters should show "0"
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4);
  });
});
