import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrainDumpInput } from './BrainDumpInput';

describe('BrainDumpInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isProcessing: false,
  };

  it('renders textarea with placeholder', () => {
    render(<BrainDumpInput {...defaultProps} />);
    expect(screen.getByLabelText('Brain dump text')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Example:/)).toBeInTheDocument();
  });

  it('renders character counter', () => {
    render(<BrainDumpInput {...defaultProps} />);
    expect(screen.getByTestId('char-counter')).toHaveTextContent('0 / 10,000 characters');
  });

  it('renders submit button with Sparkles icon text', () => {
    render(<BrainDumpInput {...defaultProps} />);
    expect(screen.getByText('Process with AI')).toBeInTheDocument();
  });

  it('disables submit button when text is too short', () => {
    render(<BrainDumpInput {...defaultProps} />);
    const button = screen.getByText('Process with AI');
    expect(button).toBeDisabled();
  });

  it('enables submit button when text meets minimum length', async () => {
    const user = userEvent.setup();
    render(<BrainDumpInput {...defaultProps} />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(50));

    const button = screen.getByText('Process with AI');
    expect(button).not.toBeDisabled();
  });

  it('shows remaining chars needed when under minimum', async () => {
    const user = userEvent.setup();
    render(<BrainDumpInput {...defaultProps} />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'hello');

    expect(screen.getByTestId('char-counter')).toHaveTextContent('45 more needed');
  });

  it('calls onSubmit with text when button clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BrainDumpInput onSubmit={onSubmit} isProcessing={false} />);

    const textarea = screen.getByLabelText('Brain dump text');
    const text = 'a'.repeat(60);
    await user.type(textarea, text);

    await user.click(screen.getByText('Process with AI'));
    expect(onSubmit).toHaveBeenCalledWith(text);
  });

  it('disables textarea and button when processing', () => {
    render(<BrainDumpInput onSubmit={vi.fn()} isProcessing={true} />);

    expect(screen.getByLabelText('Brain dump text')).toBeDisabled();
    expect(screen.getByText('Process with AI')).toBeDisabled();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<BrainDumpInput {...defaultProps} />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'hello world');

    expect(screen.getByTestId('char-counter')).toHaveTextContent('11 / 10,000 characters');
  });
});
