import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock KnowledgeGraph component
vi.mock('@/components/graph/KnowledgeGraph', () => ({
  KnowledgeGraph: () => <div data-testid="knowledge-graph">Graph Visualization</div>,
}));

import GraphPage from './page';

describe('GraphPage', () => {
  it('should redirect to login when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    await GraphPage();

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should render the page when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const page = await GraphPage();
    render(page);

    expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
    expect(screen.getByText('Visualize connections between your content')).toBeInTheDocument();
  });

  it('should render the KnowledgeGraph component', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const page = await GraphPage();
    render(page);

    expect(screen.getByTestId('knowledge-graph')).toBeInTheDocument();
  });
});
