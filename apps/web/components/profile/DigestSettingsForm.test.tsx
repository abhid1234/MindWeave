import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DigestSettingsForm } from './DigestSettingsForm';
import * as digestActions from '@/app/actions/digest';

vi.mock('@/app/actions/digest', () => ({
  getDigestSettingsAction: vi.fn(),
  updateDigestSettingsAction: vi.fn(),
}));

describe('DigestSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockReturnValue(
        new Promise(() => {})
      );
      render(<DigestSettingsForm />);
      expect(screen.getByText('Email Digest')).toBeInTheDocument();
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Display', () => {
    it('should load and display current settings', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: true,
          frequency: 'weekly',
          preferredDay: 3,
          preferredHour: 14,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Digest enabled')).toBeInTheDocument();
      });
      // Frequency select should show weekly
      const frequencySelect = screen.getByLabelText('Frequency');
      expect(frequencySelect).toHaveValue('weekly');
      // Day select should show Wednesday (index 3)
      const daySelect = screen.getByLabelText('Day');
      expect(daySelect).toHaveValue('3');
      // Hour select should show 2:00 PM (hour 14)
      const hourSelect = screen.getByLabelText('Time (UTC)');
      expect(hourSelect).toHaveValue('14');
    });

    it('should show "Enable digest emails" when disabled', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: false,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Enable digest emails')).toBeInTheDocument();
      });
    });

    it('should not show frequency/day/hour when disabled', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: false,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Enable digest emails')).toBeInTheDocument();
      });
      expect(screen.queryByLabelText('Frequency')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Day')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Time (UTC)')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Enabled', () => {
    it('should toggle enabled checkbox', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: false,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Enable digest emails')).toBeInTheDocument();
      });
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      await waitFor(() => {
        expect(screen.getByText('Digest enabled')).toBeInTheDocument();
      });
      // Now frequency/day/time selects should appear
      expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    });
  });

  describe('Weekly Frequency Day Selector', () => {
    it('should show day selector only for weekly frequency', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: true,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByLabelText('Day')).toBeInTheDocument();
      });
      // Switch to daily
      fireEvent.change(screen.getByLabelText('Frequency'), {
        target: { value: 'daily' },
      });
      await waitFor(() => {
        expect(screen.queryByLabelText('Day')).not.toBeInTheDocument();
      });
    });
  });

  describe('Save', () => {
    it('should call updateDigestSettingsAction on save', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: true,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      vi.mocked(digestActions.updateDigestSettingsAction).mockResolvedValue({
        success: true,
        message: 'Settings saved',
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Digest enabled')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

      await waitFor(() => {
        expect(digestActions.updateDigestSettingsAction).toHaveBeenCalledWith({
          enabled: true,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        });
      });
    });

    it('should show success message after save', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: true,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      vi.mocked(digestActions.updateDigestSettingsAction).mockResolvedValue({
        success: true,
        message: 'Settings saved',
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Digest enabled')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

      await waitFor(() => {
        expect(screen.getByText('Settings saved')).toBeInTheDocument();
      });
    });

    it('should clear success message after timeout', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: true,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      vi.mocked(digestActions.updateDigestSettingsAction).mockResolvedValue({
        success: true,
        message: 'Settings saved',
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(screen.getByText('Digest enabled')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

      await waitFor(() => {
        expect(screen.getByText('Settings saved')).toBeInTheDocument();
      });

      // Advance past the 3000ms timeout
      act(() => {
        vi.advanceTimersByTime(3100);
      });

      await waitFor(() => {
        expect(screen.queryByText('Settings saved')).not.toBeInTheDocument();
      });
    });
  });

  describe('Description', () => {
    it('should show description text', async () => {
      vi.mocked(digestActions.getDigestSettingsAction).mockResolvedValue({
        success: true,
        settings: {
          enabled: false,
          frequency: 'weekly',
          preferredDay: 1,
          preferredHour: 9,
        },
      });
      render(<DigestSettingsForm />);
      await waitFor(() => {
        expect(
          screen.getByText(
            /get a summary of your recent captures and ai-discovered topics/i
          )
        ).toBeInTheDocument();
      });
    });
  });
});
