import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionCard } from './ConnectionCard';
import type { ConnectionResult } from '@/types/connections';

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

const mockConnection: ConnectionResult = {
  id: 'conn-1',
  contentA: {
    id: 'c1',
    title: 'Machine Learning Basics',
    type: 'note',
    tags: ['ai', 'machine-learning'],
  },
  contentB: {
    id: 'c2',
    title: 'Cooking with Precision',
    type: 'link',
    tags: ['cooking', 'science'],
  },
  insight: 'Both machine learning and precision cooking rely on iterative optimization.',
  similarity: 42,
  tagGroupA: ['ai', 'machine-learning'],
  tagGroupB: ['cooking', 'science'],
};

describe('ConnectionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render content titles', () => {
    render(<ConnectionCard connection={mockConnection} />);
    expect(screen.getByText('Machine Learning Basics')).toBeDefined();
    expect(screen.getByText('Cooking with Precision')).toBeDefined();
  });

  it('should render similarity percentage', () => {
    render(<ConnectionCard connection={mockConnection} />);
    expect(screen.getByText('42% similarity')).toBeDefined();
  });

  it('should render AI insight', () => {
    render(<ConnectionCard connection={mockConnection} />);
    expect(screen.getByText(/iterative optimization/)).toBeDefined();
  });

  it('should render content types', () => {
    render(<ConnectionCard connection={mockConnection} />);
    expect(screen.getByText('note')).toBeDefined();
    expect(screen.getByText('link')).toBeDefined();
  });

  it('should copy post text to clipboard on share', async () => {
    render(<ConnectionCard connection={mockConnection} />);

    const shareButton = screen.getByText('Share as Post');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Machine Learning Basics')
      );
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Cooking with Precision')
      );
    });
  });
});
