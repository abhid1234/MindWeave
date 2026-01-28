import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

describe('Collapsible', () => {
  it('renders children with closed state by default', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Toggle')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('opens when defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('toggles on trigger click (uncontrolled)', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Content')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('works in controlled mode', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible open={false} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle'));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <Collapsible open={true} onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('trigger calls onClick prop', () => {
    const onClick = vi.fn();
    render(
      <Collapsible>
        <CollapsibleTrigger onClick={onClick}>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(onClick).toHaveBeenCalled();
  });

  it('trigger sets aria-expanded', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  it('asChild renders child with click handler', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <span>Custom</span>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    fireEvent.click(screen.getByText('Custom'));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('asChild calls original child onClick', () => {
    const childClick = vi.fn();
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <span onClick={childClick}>Custom</span>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    fireEvent.click(screen.getByText('Custom'));
    expect(childClick).toHaveBeenCalled();
  });

  it('trigger throws when used outside Collapsible', () => {
    expect(() => render(<CollapsibleTrigger>T</CollapsibleTrigger>)).toThrow(
      'CollapsibleTrigger must be used within a Collapsible'
    );
  });

  it('content throws when used outside Collapsible', () => {
    expect(() => render(<CollapsibleContent>C</CollapsibleContent>)).toThrow(
      'CollapsibleContent must be used within a Collapsible'
    );
  });

  it('applies className and data-state', () => {
    const { container } = render(
      <Collapsible className="my-class">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveAttribute('data-state', 'closed');
    expect(div.className).toContain('my-class');
  });
});
