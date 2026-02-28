import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from './TemplateSelector';
import { TEMPLATES } from '@/lib/templates';

describe('TemplateSelector', () => {
  const mockOnSelect = vi.fn();

  it('should render all templates plus blank option', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate={null} />);

    // Blank + 5 templates = 6 buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('should render template names', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate={null} />);

    expect(screen.getByText('Blank')).toBeInTheDocument();
    for (const t of TEMPLATES) {
      expect(screen.getByText(t.name)).toBeInTheDocument();
    }
  });

  it('should render template label text', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate={null} />);

    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  it('should call onSelect with template ID when clicked', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate={null} />);

    fireEvent.click(screen.getByText('Meeting Notes'));
    expect(mockOnSelect).toHaveBeenCalledWith('meeting-notes');
  });

  it('should call onSelect with null when Blank is clicked', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate="meeting-notes" />);

    fireEvent.click(screen.getByText('Blank'));
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('should highlight selected template', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate="meeting-notes" />);

    const meetingButton = screen.getByText('Meeting Notes').closest('button');
    expect(meetingButton?.className).toContain('border-primary');
  });

  it('should highlight Blank when no template selected', () => {
    render(<TemplateSelector onSelect={mockOnSelect} selectedTemplate={null} />);

    const blankButton = screen.getByText('Blank').closest('button');
    expect(blankButton?.className).toContain('border-primary');
  });
});
