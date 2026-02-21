import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import CapturePage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the content actions
vi.mock('@/app/actions/content', () => ({
  createContentAction: vi.fn(),
}));

describe('CapturePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the capture form for note type by default', () => {
      render(<CapturePage />);

      expect(screen.getByRole('heading', { name: /capture/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /note/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
      // URL field is not shown for note type
      expect(screen.queryByLabelText(/^url$/i)).not.toBeInTheDocument();
    });

    it('should render all form fields with correct default values', () => {
      render(<CapturePage />);

      const noteCard = screen.getByRole('radio', { name: /note/i });
      expect(noteCard).toHaveAttribute('aria-checked', 'true');

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render content type options', () => {
      render(<CapturePage />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);

      expect(screen.getByRole('radio', { name: /note/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /link/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /file/i })).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<CapturePage />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('form interaction', () => {
    it('should allow typing in title field', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'My Test Note');

      expect(titleInput).toHaveValue('My Test Note');
    });

    it('should allow typing in body field', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const bodyTextarea = screen.getByLabelText(/content \(optional\)/i);
      await user.type(bodyTextarea, 'This is my note content');

      expect(bodyTextarea).toHaveValue('This is my note content');
    });

    it('should allow typing in URL field when link type is selected', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      // Select link type first to show URL field
      const linkCard = screen.getByRole('radio', { name: /link/i });
      await user.click(linkCard);

      const urlInput = screen.getByLabelText(/^url$/i);
      await user.type(urlInput, 'https://example.com');

      expect(urlInput).toHaveValue('https://example.com');
    });

    it('should allow adding tags via TagInput', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const tagsInput = screen.getByPlaceholderText('Add tags...');
      await user.type(tagsInput, 'tag1{Enter}');

      // Badge should appear for the tag
      expect(screen.getByText('tag1')).toBeInTheDocument();
    });

    it('should allow changing content type', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const linkCard = screen.getByRole('radio', { name: /link/i });
      await user.click(linkCard);

      expect(linkCard).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /note/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('should show file upload when file type is selected', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const fileCard = screen.getByRole('radio', { name: /file/i });
      await user.click(fileCard);

      expect(fileCard).toHaveAttribute('aria-checked', 'true');
      // File upload area should be visible
      expect(screen.getByText(/click or drag file to upload/i)).toBeInTheDocument();
      // Description field should show instead of content
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should hide URL field when switching from link to note type', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      // Switch to link type
      const linkCard = screen.getByRole('radio', { name: /link/i });
      await user.click(linkCard);
      expect(screen.getByLabelText(/^url$/i)).toBeInTheDocument();

      // Switch back to note type
      const noteCard = screen.getByRole('radio', { name: /note/i });
      await user.click(noteCard);
      expect(screen.queryByLabelText(/^url$/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    // Note: Form submission with server actions and useTransition is difficult to test
    // in React Testing Library. These scenarios are covered by E2E tests instead.

    it.skip('should call createContentAction on form submit', async () => {
      // Tested in E2E tests
    });

    it.skip('should display success message on successful submission', async () => {
      // Tested in E2E tests
    });

    it.skip('should display error message on failed submission', async () => {
      // Tested in E2E tests
    });

    it.skip('should display field-specific errors', async () => {
      // Tested in E2E tests
    });

    it.skip('should disable form fields during submission', async () => {
      // Tested in E2E tests
    });

    it.skip('should clear feedback on new submission', async () => {
      // Tested in E2E tests
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for all form fields (note type)', () => {
      render(<CapturePage />);

      expect(screen.getByRole('radiogroup', { name: /content type/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
    });

    it('should show URL field when link type is selected', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const linkCard = screen.getByRole('radio', { name: /link/i });
      await user.click(linkCard);

      expect(screen.getByLabelText(/^url$/i)).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(<CapturePage />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute('required');
    });

    it.skip('should use alert role for feedback messages', async () => {
      // Tested in E2E tests
    });
  });
});
