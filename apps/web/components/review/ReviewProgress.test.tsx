import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewProgress } from './ReviewProgress';

describe('ReviewProgress', () => {
  it('should display current and total count', () => {
    render(<ReviewProgress current={3} total={8} />);
    expect(screen.getByText('3 of 8 reviewed')).toBeInTheDocument();
  });

  it('should display percentage', () => {
    render(<ReviewProgress current={4} total={8} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render progressbar with correct aria attributes', () => {
    render(<ReviewProgress current={2} total={6} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '6');
  });

  it('should handle zero total without error', () => {
    render(<ReviewProgress current={0} total={0} />);
    expect(screen.getByText('0 of 0 reviewed')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
