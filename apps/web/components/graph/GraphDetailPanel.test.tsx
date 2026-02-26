import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
}));

vi.mock('@/app/actions/graph', () => ({}));

import { GraphDetailPanel } from './GraphDetailPanel';

const defaultNode = {
  id: 'node-1',
  title: 'My Test Note',
  type: 'note' as const,
  tags: ['typescript', 'react', 'testing'],
  community: 2,
  pageRank: 0.45,
};

const defaultProps = {
  node: defaultNode,
  connectionCount: 5,
  communityColor: '#ff6633',
  onClose: vi.fn(),
  onNavigate: vi.fn(),
};

describe('GraphDetailPanel', () => {
  it('renders node title', () => {
    render(<GraphDetailPanel {...defaultProps} />);

    expect(screen.getByText('My Test Note')).toBeInTheDocument();
  });

  it('renders node type', () => {
    render(<GraphDetailPanel {...defaultProps} />);

    expect(screen.getByText('note')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<GraphDetailPanel {...defaultProps} />);

    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<GraphDetailPanel {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByTestId('detail-close'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onNavigate when "View in Library" clicked', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<GraphDetailPanel {...defaultProps} onNavigate={onNavigate} />);

    await user.click(screen.getByTestId('detail-navigate'));

    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
