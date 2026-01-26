import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render badge with children', () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should apply secondary variant styles', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should apply destructive variant styles', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should apply outline variant styles', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('border', 'border-input', 'bg-background');
    });
  });

  describe('Removable functionality', () => {
    it('should not show remove button when not removable', () => {
      render(<Badge>Not Removable</Badge>);
      expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument();
    });

    it('should show remove button when removable', () => {
      render(<Badge removable>Removable</Badge>);
      expect(screen.getByLabelText('Remove')).toBeInTheDocument();
    });

    it('should call onRemove when remove button is clicked', () => {
      const handleRemove = vi.fn();
      render(<Badge removable onRemove={handleRemove}>Removable</Badge>);

      const removeButton = screen.getByLabelText('Remove');
      fireEvent.click(removeButton);

      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation when remove button is clicked', () => {
      const handleRemove = vi.fn();
      const handleBadgeClick = vi.fn();

      render(
        <div onClick={handleBadgeClick}>
          <Badge removable onRemove={handleRemove}>Removable</Badge>
        </div>
      );

      const removeButton = screen.getByLabelText('Remove');
      fireEvent.click(removeButton);

      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleBadgeClick).not.toHaveBeenCalled();
    });

    it('should render remove icon SVG', () => {
      render(<Badge removable>Removable</Badge>);
      const removeButton = screen.getByLabelText('Remove');
      const svg = removeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should merge custom className', () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('should pass through HTML div props', () => {
      render(
        <Badge data-testid="test-badge" role="status">
          Test
        </Badge>
      );

      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('role', 'status');
    });
  });

  describe('Styling', () => {
    it('should have base styles', () => {
      const { container } = render(<Badge>Base</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1', 'rounded-full', 'px-2.5', 'py-0.5', 'text-xs', 'font-medium', 'transition-all');
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Badge with ref</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
