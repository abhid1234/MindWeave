import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportProgress } from './ImportProgress';

describe('ImportProgress', () => {
  it('should not render when not importing', () => {
    const { container } = render(
      <ImportProgress itemCount={10} isImporting={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render basic spinner when importing', () => {
    render(<ImportProgress itemCount={10} isImporting={true} />);
    expect(screen.getByText('Importing 10 items...')).toBeInTheDocument();
  });

  it('should show fallback message without detailed progress', () => {
    render(<ImportProgress itemCount={5} isImporting={true} />);
    expect(screen.getByText(/ai tagging and embeddings/i)).toBeInTheDocument();
  });

  it('should show progress bar with detailed stats', () => {
    render(
      <ImportProgress
        itemCount={10}
        isImporting={true}
        imported={5}
        skipped={2}
        failed={1}
        total={10}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('8 / 10 (80%)')).toBeInTheDocument();
  });

  it('should show imported count in green', () => {
    render(
      <ImportProgress
        itemCount={10}
        isImporting={true}
        imported={5}
        skipped={0}
        failed={0}
        total={10}
      />
    );

    expect(screen.getByText('5 imported')).toBeInTheDocument();
  });

  it('should show skipped count in yellow', () => {
    render(
      <ImportProgress
        itemCount={10}
        isImporting={true}
        imported={3}
        skipped={2}
        failed={0}
        total={10}
      />
    );

    expect(screen.getByText('2 skipped')).toBeInTheDocument();
  });

  it('should show failed count in red', () => {
    render(
      <ImportProgress
        itemCount={10}
        isImporting={true}
        imported={3}
        skipped={0}
        failed={1}
        total={10}
      />
    );

    expect(screen.getByText('1 failed')).toBeInTheDocument();
  });

  it('should not show zero counters', () => {
    render(
      <ImportProgress
        itemCount={10}
        isImporting={true}
        imported={5}
        skipped={0}
        failed={0}
        total={10}
      />
    );

    expect(screen.queryByText('0 skipped')).not.toBeInTheDocument();
    expect(screen.queryByText('0 failed')).not.toBeInTheDocument();
  });

  it('should be backward compatible with old props', () => {
    render(<ImportProgress itemCount={15} isImporting={true} />);

    // Should show old behavior - no progress bar
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Importing 15 items...')).toBeInTheDocument();
  });
});
