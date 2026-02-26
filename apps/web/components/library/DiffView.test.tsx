import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffView } from './DiffView';

describe('DiffView', () => {
  it('renders "No changes" when oldText equals newText', () => {
    render(<DiffView oldText="hello world" newText="hello world" />);

    expect(screen.getByText('No changes')).toBeInTheDocument();
    // Should not render the mode toggle when there are no changes
    expect(screen.queryByTestId('mode-toggle')).not.toBeInTheDocument();
  });

  it('renders added text with diff-added data-testid', () => {
    render(<DiffView oldText="hello" newText="hello world" />);

    const addedElements = screen.getAllByTestId('diff-added');
    expect(addedElements.length).toBeGreaterThan(0);

    const addedText = addedElements.map((el) => el.textContent).join('');
    expect(addedText).toContain('world');
  });

  it('renders removed text with diff-removed data-testid', () => {
    render(<DiffView oldText="hello world" newText="hello" />);

    const removedElements = screen.getAllByTestId('diff-removed');
    expect(removedElements.length).toBeGreaterThan(0);

    const removedText = removedElements.map((el) => el.textContent).join('');
    expect(removedText).toContain('world');
  });

  it('applies correct CSS classes to added parts', () => {
    render(<DiffView oldText="foo" newText="foo bar" />);

    const addedElements = screen.getAllByTestId('diff-added');
    for (const el of addedElements) {
      expect(el.className).toContain('bg-green-100');
      expect(el.className).toContain('text-green-800');
    }
  });

  it('applies correct CSS classes to removed parts', () => {
    render(<DiffView oldText="foo bar" newText="foo" />);

    const removedElements = screen.getAllByTestId('diff-removed');
    for (const el of removedElements) {
      expect(el.className).toContain('bg-red-100');
      expect(el.className).toContain('text-red-800');
      expect(el.className).toContain('line-through');
    }
  });

  it('renders mode toggle button in inline mode', () => {
    render(<DiffView oldText="a" newText="b" />);

    const toggle = screen.getByTestId('mode-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('Switch to Side-by-Side');
  });

  it('toggles from inline to side-by-side mode', () => {
    render(<DiffView oldText="line one" newText="line two" />);

    const toggle = screen.getByTestId('mode-toggle');
    expect(toggle).toHaveTextContent('Switch to Side-by-Side');

    fireEvent.click(toggle);

    const updatedToggle = screen.getByTestId('mode-toggle');
    expect(updatedToggle).toHaveTextContent('Switch to Inline');
  });

  it('toggles from side-by-side back to inline mode', () => {
    render(<DiffView oldText="line one" newText="line two" mode="side-by-side" />);

    const toggle = screen.getByTestId('mode-toggle');
    expect(toggle).toHaveTextContent('Switch to Inline');

    fireEvent.click(toggle);

    const updatedToggle = screen.getByTestId('mode-toggle');
    expect(updatedToggle).toHaveTextContent('Switch to Side-by-Side');
  });

  it('side-by-side mode renders two columns with labels', () => {
    render(
      <DiffView
        oldText="old content"
        newText="new content"
        oldLabel="Before"
        newLabel="After"
        mode="side-by-side"
      />
    );

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('uses default labels "Previous" and "Current" in side-by-side mode', () => {
    render(
      <DiffView oldText="old content" newText="new content" mode="side-by-side" />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('works with empty strings (both empty)', () => {
    render(<DiffView oldText="" newText="" />);

    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  it('works with empty old text and non-empty new text', () => {
    render(<DiffView oldText="" newText="new content" />);

    const addedElements = screen.getAllByTestId('diff-added');
    expect(addedElements.length).toBeGreaterThan(0);

    const addedText = addedElements.map((el) => el.textContent).join('');
    expect(addedText).toContain('new content');
  });

  it('works with non-empty old text and empty new text', () => {
    render(<DiffView oldText="old content" newText="" />);

    const removedElements = screen.getAllByTestId('diff-removed');
    expect(removedElements.length).toBeGreaterThan(0);

    const removedText = removedElements.map((el) => el.textContent).join('');
    expect(removedText).toContain('old content');
  });

  it('renders both added and removed parts for modified text', () => {
    render(<DiffView oldText="the quick fox" newText="the slow fox" />);

    const addedElements = screen.getAllByTestId('diff-added');
    const removedElements = screen.getAllByTestId('diff-removed');

    expect(addedElements.length).toBeGreaterThan(0);
    expect(removedElements.length).toBeGreaterThan(0);
  });

  it('respects initialMode prop set to side-by-side', () => {
    render(
      <DiffView oldText="alpha" newText="beta" mode="side-by-side" />
    );

    // Should show the side-by-side labels
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle')).toHaveTextContent('Switch to Inline');
  });
});
