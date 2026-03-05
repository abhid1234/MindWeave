import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PathProgressBar } from './PathProgressBar';

describe('PathProgressBar', () => {
  it('should render progress text', () => {
    render(<PathProgressBar completed={3} total={10} />);
    expect(screen.getByText('3/10 complete')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('should render 0% when total is 0', () => {
    render(<PathProgressBar completed={0} total={0} />);
    expect(screen.getByText('0/0 complete')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should render 100% when all complete', () => {
    render(<PathProgressBar completed={5} total={5} />);
    expect(screen.getByText('5/5 complete')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should have progressbar role with correct aria attributes', () => {
    render(<PathProgressBar completed={2} total={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should apply custom className', () => {
    const { container } = render(<PathProgressBar completed={1} total={2} className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });

  it('should set correct width style on progress bar', () => {
    render(<PathProgressBar completed={3} total={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveStyle({ width: '75%' });
  });
});
