import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from './InstallPrompt';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

describe('InstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  function fireBeforeInstallPrompt(promptFn?: () => Promise<void>, outcome: 'accepted' | 'dismissed' = 'accepted') {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperty(event, 'prompt', {
      value: promptFn || vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(event, 'userChoice', {
      value: Promise.resolve({ outcome }),
    });
    window.dispatchEvent(event);
    return event;
  }

  it('should not render initially when no beforeinstallprompt event has fired', () => {
    render(<InstallPrompt />);

    expect(screen.queryByText('Install Mindweave')).not.toBeInTheDocument();
  });

  it('should render after beforeinstallprompt event is dispatched', () => {
    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt();
    });

    expect(screen.getByText('Install Mindweave')).toBeInTheDocument();
    expect(screen.getByText(/install the app for a better experience/i)).toBeInTheDocument();
  });

  it('should show Install and Not now buttons when visible', () => {
    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt();
    });

    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument();
  });

  it('should call prompt() on the deferred event when Install button is clicked', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt(mockPrompt, 'accepted');
    });

    await user.click(screen.getByRole('button', { name: /^install$/i }));

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  it('should hide prompt when user accepts the install', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt(vi.fn().mockResolvedValue(undefined), 'accepted');
    });

    expect(screen.getByText('Install Mindweave')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^install$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Install Mindweave')).not.toBeInTheDocument();
    });
  });

  it('should set localStorage flag and hide when dismissed via Not now', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt();
    });

    expect(screen.getByText('Install Mindweave')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /not now/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('pwa-install-dismissed', 'true');
    expect(screen.queryByText('Install Mindweave')).not.toBeInTheDocument();
  });

  it('should set localStorage flag and hide when dismissed via X button', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt();
    });

    expect(screen.getByText('Install Mindweave')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('pwa-install-dismissed', 'true');
    expect(screen.queryByText('Install Mindweave')).not.toBeInTheDocument();
  });

  it('should not show if localStorage dismissal flag already exists', () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt();
    });

    expect(screen.queryByText('Install Mindweave')).not.toBeInTheDocument();
  });

  it('should handle prompt rejection gracefully (dismissed outcome)', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<InstallPrompt />);

    act(() => {
      fireBeforeInstallPrompt(mockPrompt, 'dismissed');
    });

    expect(screen.getByText('Install Mindweave')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^install$/i }));

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
    });

    // Component should still be visible when user dismisses the native prompt
    // (but deferredPrompt is set to null, so the prompt won't fire again)
    // The component remains visible since outcome !== 'accepted' doesn't hide it
  });
});
