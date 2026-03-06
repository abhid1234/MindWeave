import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructuredNoteCard, type StructuredNoteData } from './StructuredNoteCard';

const mockNote: StructuredNoteData = {
  title: 'Test Note Title',
  body: 'This is the note body with some content.',
  tags: ['react', 'typescript', 'testing'],
  actionItems: ['Write tests', 'Deploy to prod'],
};

describe('StructuredNoteCard', () => {
  const defaultProps = {
    note: mockNote,
    index: 0,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
  };

  it('renders note title', () => {
    render(<StructuredNoteCard {...defaultProps} />);
    expect(screen.getByText('Test Note Title')).toBeInTheDocument();
  });

  it('renders note body', () => {
    render(<StructuredNoteCard {...defaultProps} />);
    expect(screen.getByText('This is the note body with some content.')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<StructuredNoteCard {...defaultProps} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('renders action items', () => {
    render(<StructuredNoteCard {...defaultProps} />);
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Deploy to prod')).toBeInTheDocument();
    expect(screen.getByText('Action Items')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<StructuredNoteCard {...defaultProps} onRemove={onRemove} />);

    await user.click(screen.getByLabelText('Remove note'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('removes tag when tag X button clicked', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<StructuredNoteCard {...defaultProps} onUpdate={onUpdate} />);

    await user.click(screen.getByLabelText('Remove tag react'));
    expect(onUpdate).toHaveBeenCalledWith({
      ...mockNote,
      tags: ['typescript', 'testing'],
    });
  });

  it('enters title edit mode on click', async () => {
    const user = userEvent.setup();
    render(<StructuredNoteCard {...defaultProps} />);

    await user.click(screen.getByText('Test Note Title'));
    expect(screen.getByLabelText('Edit note title')).toBeInTheDocument();
  });

  it('saves edited title on Enter', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<StructuredNoteCard {...defaultProps} onUpdate={onUpdate} />);

    await user.click(screen.getByText('Test Note Title'));
    const input = screen.getByLabelText('Edit note title');
    await user.clear(input);
    await user.type(input, 'New Title{Enter}');

    expect(onUpdate).toHaveBeenCalledWith({
      ...mockNote,
      title: 'New Title',
    });
  });

  it('cancels title edit on Escape', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<StructuredNoteCard {...defaultProps} onUpdate={onUpdate} />);

    await user.click(screen.getByText('Test Note Title'));
    const input = screen.getByLabelText('Edit note title');
    await user.clear(input);
    await user.type(input, 'New Title{Escape}');

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Test Note Title')).toBeInTheDocument();
  });

  it('applies color-coded left border based on index', () => {
    render(<StructuredNoteCard {...defaultProps} index={0} />);
    const card = screen.getByTestId('structured-note-0');
    expect(card.className).toContain('border-l-blue-500');
  });

  it('cycles border colors for different indices', () => {
    render(<StructuredNoteCard {...defaultProps} index={1} />);
    const card = screen.getByTestId('structured-note-1');
    expect(card.className).toContain('border-l-emerald-500');
  });

  it('does not render body section when body is empty', () => {
    const noteWithoutBody = { ...mockNote, body: '' };
    render(<StructuredNoteCard {...defaultProps} note={noteWithoutBody} />);
    expect(screen.queryByText('This is the note body')).not.toBeInTheDocument();
  });

  it('does not render tags section when tags are empty', () => {
    const noteWithoutTags = { ...mockNote, tags: [] };
    render(<StructuredNoteCard {...defaultProps} note={noteWithoutTags} />);
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  it('does not render action items section when empty', () => {
    const noteWithoutActions = { ...mockNote, actionItems: [] };
    render(<StructuredNoteCard {...defaultProps} note={noteWithoutActions} />);
    expect(screen.queryByText('Action Items')).not.toBeInTheDocument();
  });

  it('has correct animation delay based on index', () => {
    render(<StructuredNoteCard {...defaultProps} index={3} />);
    const card = screen.getByTestId('structured-note-3');
    expect(card.style.animationDelay).toBe('300ms');
  });
});
