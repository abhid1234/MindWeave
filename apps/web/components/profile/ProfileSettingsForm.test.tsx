import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileSettingsForm from './ProfileSettingsForm';
import * as profileActions from '@/app/actions/profile';

vi.mock('@/app/actions/profile', () => ({
  updateProfile: vi.fn(),
}));

// Mock window.location.origin for profile URL
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:3000' },
  writable: true,
});

describe('ProfileSettingsForm', () => {
  const defaultProps = {
    initialData: {
      username: 'testuser',
      bio: 'I love knowledge management',
      isProfilePublic: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with initial data', () => {
    it('should render with initial username', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const usernameInput = screen.getByLabelText('Username');
      expect(usernameInput).toHaveValue('testuser');
    });

    it('should render with initial bio', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const bioInput = screen.getByLabelText('Bio');
      expect(bioInput).toHaveValue('I love knowledge management');
    });

    it('should render with null initial data as empty strings', () => {
      render(
        <ProfileSettingsForm
          initialData={{ username: null, bio: null, isProfilePublic: false }}
        />
      );
      const usernameInput = screen.getByLabelText('Username');
      expect(usernameInput).toHaveValue('');
      const bioInput = screen.getByLabelText('Bio');
      expect(bioInput).toHaveValue('');
    });
  });

  describe('Username behavior', () => {
    it('should lowercase username input', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'MyUserName' } });
      expect(usernameInput).toHaveValue('myusername');
    });
  });

  describe('Bio character count', () => {
    it('should show bio character count', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      // "I love knowledge management" is 27 characters
      expect(screen.getByText('27/500')).toBeInTheDocument();
    });

    it('should update character count on bio change', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const bioInput = screen.getByLabelText('Bio');
      fireEvent.change(bioInput, { target: { value: 'Hello' } });
      expect(screen.getByText('5/500')).toBeInTheDocument();
    });
  });

  describe('Public profile checkbox', () => {
    it('should render public profile checkbox unchecked by default', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const checkbox = screen.getByLabelText('Make profile public');
      expect(checkbox).not.toBeChecked();
    });

    it('should render public profile checkbox checked when true', () => {
      render(
        <ProfileSettingsForm
          initialData={{ ...defaultProps.initialData, isProfilePublic: true }}
        />
      );
      const checkbox = screen.getByLabelText('Make profile public');
      expect(checkbox).toBeChecked();
    });

    it('should toggle public profile checkbox', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      const checkbox = screen.getByLabelText('Make profile public');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Profile URL', () => {
    it('should show profile URL when public and username exists', () => {
      render(
        <ProfileSettingsForm
          initialData={{ ...defaultProps.initialData, isProfilePublic: true }}
        />
      );
      expect(
        screen.getByText(/your public profile url/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText('http://localhost:3000/profile/testuser')
      ).toBeInTheDocument();
    });

    it('should not show profile URL when not public', () => {
      render(<ProfileSettingsForm {...defaultProps} />);
      expect(
        screen.queryByText(/your public profile url/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('should call updateProfile on form submission', async () => {
      vi.mocked(profileActions.updateProfile).mockResolvedValue({
        success: true,
        message: 'Profile updated',
      });
      render(<ProfileSettingsForm {...defaultProps} />);
      const submitButton = screen.getByRole('button', {
        name: /save profile/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(profileActions.updateProfile).toHaveBeenCalledWith({
          username: 'testuser',
          bio: 'I love knowledge management',
          isProfilePublic: false,
        });
      });
    });

    it('should show success message after successful update', async () => {
      vi.mocked(profileActions.updateProfile).mockResolvedValue({
        success: true,
        message: 'Profile updated',
      });
      render(<ProfileSettingsForm {...defaultProps} />);
      fireEvent.click(
        screen.getByRole('button', { name: /save profile/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('Profile updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('should show error message after failed update', async () => {
      vi.mocked(profileActions.updateProfile).mockResolvedValue({
        success: false,
        message: 'Username is already taken',
      });
      render(<ProfileSettingsForm {...defaultProps} />);
      fireEvent.click(
        screen.getByRole('button', { name: /save profile/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('Username is already taken')
        ).toBeInTheDocument();
      });
    });

    it('should show saving state while submitting', async () => {
      vi.mocked(profileActions.updateProfile).mockReturnValue(
        new Promise(() => {})
      );
      render(<ProfileSettingsForm {...defaultProps} />);
      fireEvent.click(
        screen.getByRole('button', { name: /save profile/i })
      );
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });
});
