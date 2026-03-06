import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BeforeAfterView } from './BeforeAfterView';

const mockNotes = [
  {
    title: 'First Note',
    body: 'Body of first note',
    tags: ['tag1', 'tag2'],
    actionItems: [],
  },
  {
    title: 'Second Note',
    body: 'Body of second note',
    tags: ['tag3'],
    actionItems: ['Do something'],
  },
];

const rawText = 'This is the raw brain dump text with ideas mixed together.';

describe('BeforeAfterView', () => {
  it('renders before and after sections', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('renders raw text in before section', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByText(rawText)).toBeInTheDocument();
  });

  it('renders structured note titles in after section', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();
  });

  it('renders note tags in after section', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
  });

  it('renders note bodies in after section', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByText('Body of first note')).toBeInTheDocument();
    expect(screen.getByText('Body of second note')).toBeInTheDocument();
  });

  it('has data-testid for the container', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    expect(screen.getByTestId('before-after-view')).toBeInTheDocument();
  });

  it('renders with monospace font for raw text', () => {
    render(<BeforeAfterView rawText={rawText} notes={mockNotes} />);
    const preElement = screen.getByText(rawText);
    expect(preElement.tagName.toLowerCase()).toBe('pre');
    expect(preElement.className).toContain('font-mono');
  });
});
