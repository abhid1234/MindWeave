import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    it('should render the capture form', () => {
      render(<CapturePage />);

      expect(screen.getByRole('heading', { name: /capture/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('should render all form fields with correct default values', () => {
      render(<CapturePage />);

      const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('note');

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render content type options', () => {
      render(<CapturePage />);

      const typeSelect = screen.getByLabelText(/type/i);
      const options = typeSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map(opt => opt.value);

      expect(optionValues).toContain('note');
      expect(optionValues).toContain('link');
      expect(optionValues).toContain('file');
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

      const bodyTextarea = screen.getByLabelText(/content/i);
      await user.type(bodyTextarea, 'This is my note content');

      expect(bodyTextarea).toHaveValue('This is my note content');
    });

    it('should allow typing in URL field', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const urlInput = screen.getByLabelText(/url/i);
      await user.type(urlInput, 'https://example.com');

      expect(urlInput).toHaveValue('https://example.com');
    });

    it('should allow typing in tags field', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'tag1, tag2, tag3');

      expect(tagsInput).toHaveValue('tag1, tag2, tag3');
    });

    it('should allow changing content type', async () => {
      const user = userEvent.setup();
      render(<CapturePage />);

      const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'link');

      expect(typeSelect.value).toBe('link');
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
    it('should have proper labels for all form fields', () => {
      render(<CapturePage />);

      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
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
