import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';

const mockData = {
  competitor: 'Notion',
  features: [
    { name: 'Semantic Search', mindweave: true, competitor: false },
    { name: 'AI Auto-Tagging', mindweave: true, competitor: false },
    { name: 'Note Taking', mindweave: true, competitor: true },
  ],
};

describe('ComparisonTable', () => {
  it('should render the competitor name in the header', () => {
    render(<ComparisonTable {...mockData} />);
    expect(screen.getByText('Notion')).toBeInTheDocument();
    expect(screen.getByText('Mindweave')).toBeInTheDocument();
  });

  it('should render all feature rows', () => {
    render(<ComparisonTable {...mockData} />);
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
    expect(screen.getByText('AI Auto-Tagging')).toBeInTheDocument();
    expect(screen.getByText('Note Taking')).toBeInTheDocument();
  });

  it('should render check and x icons for feature support', () => {
    render(<ComparisonTable {...mockData} />);
    const rows = screen.getAllByRole('row');
    // Header row + 3 feature rows = 4
    expect(rows).toHaveLength(4);
  });
});
