import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeysManager } from './ApiKeysManager';
import * as apiKeysActions from '@/app/actions/api-keys';

vi.mock('@/app/actions/api-keys', () => ({
  listApiKeysAction: vi.fn(),
  createApiKeyAction: vi.fn(),
  revokeApiKeyAction: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const mockActiveKey: apiKeysActions.ApiKeyListItem = {
  id: 'key-1',
  name: 'My CLI Key',
  keyPrefix: 'mw_abc123',
  lastUsedAt: new Date('2025-06-15T00:00:00Z'),
  expiresAt: new Date('2026-06-15T00:00:00Z'),
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
};

const mockActiveKey2: apiKeysActions.ApiKeyListItem = {
  id: 'key-2',
  name: 'Browser Extension',
  keyPrefix: 'mw_def456',
  lastUsedAt: null,
  expiresAt: null,
  isActive: true,
  createdAt: new Date('2025-03-10T00:00:00Z'),
};

const mockRevokedKey: apiKeysActions.ApiKeyListItem = {
  id: 'key-3',
  name: 'Old Key',
  keyPrefix: 'mw_old789',
  lastUsedAt: null,
  expiresAt: null,
  isActive: false,
  createdAt: new Date('2024-06-01T00:00:00Z'),
};

describe('ApiKeysManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockReturnValue(
        new Promise(() => {})
      );
      render(<ApiKeysManager />);
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no keys exist', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Listing Keys', () => {
    it('should list active keys with name, prefix, and dates', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('My CLI Key')).toBeInTheDocument();
      });
      expect(screen.getByText('mw_abc123...')).toBeInTheDocument();
      expect(screen.getByText(/Created 1\/1\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/Last used 6\/15\/2025/)).toBeInTheDocument();
      expect(screen.getByText(/Expires 6\/15\/2026/)).toBeInTheDocument();
    });

    it('should list multiple active keys', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey, mockActiveKey2],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('My CLI Key')).toBeInTheDocument();
      });
      expect(screen.getByText('Browser Extension')).toBeInTheDocument();
    });

    it('should not show last used if null', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey2],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('Browser Extension')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Last used/)).not.toBeInTheDocument();
    });

    it('should not show expires if null', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey2],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('Browser Extension')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Expires/)).not.toBeInTheDocument();
    });

    it('should show revoked keys in separate section', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey, mockRevokedKey],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('My CLI Key')).toBeInTheDocument();
      });
      expect(screen.getByText('Revoked')).toBeInTheDocument();
      expect(screen.getByText('Old Key')).toBeInTheDocument();
    });
  });

  describe('Create Key Dialog', () => {
    it('should open create dialog on button click', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /create key/i }));
      await waitFor(() => {
        expect(screen.getByText('Create API Key')).toBeInTheDocument();
      });
    });

    it('should have disabled Create button when name is empty', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /create key/i }));
      await waitFor(() => {
        expect(screen.getByText('Create API Key')).toBeInTheDocument();
      });
      const createButton = screen.getByRole('button', { name: 'Create' });
      expect(createButton).toBeDisabled();
    });

    it('should call createApiKeyAction and display raw key', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      vi.mocked(apiKeysActions.createApiKeyAction).mockResolvedValue({
        success: true,
        message: 'API key created.',
        rawKey: 'mw_raw_secret_key_12345',
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /create key/i }));
      await waitFor(() => {
        expect(screen.getByText('Create API Key')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'New Key' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(apiKeysActions.createApiKeyAction).toHaveBeenCalledWith({
          name: 'New Key',
          expiresInDays: undefined,
        });
      });
      await waitFor(() => {
        expect(screen.getByText('mw_raw_secret_key_12345')).toBeInTheDocument();
      });
      expect(screen.getByText('API Key Created')).toBeInTheDocument();
    });

    it('should pass expiresInDays when specified', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      vi.mocked(apiKeysActions.createApiKeyAction).mockResolvedValue({
        success: true,
        message: 'API key created.',
        rawKey: 'mw_raw_key_xyz',
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /create key/i }));
      await waitFor(() => {
        expect(screen.getByText('Create API Key')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Expiring Key' },
      });
      fireEvent.change(screen.getByLabelText(/expires in/i), {
        target: { value: '30' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(apiKeysActions.createApiKeyAction).toHaveBeenCalledWith({
          name: 'Expiring Key',
          expiresInDays: 30,
        });
      });
    });

    it('should copy raw key to clipboard when copy button is clicked', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      vi.mocked(apiKeysActions.createApiKeyAction).mockResolvedValue({
        success: true,
        message: 'Created.',
        rawKey: 'mw_copy_this_key',
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /create key/i }));
      await waitFor(() => {
        expect(screen.getByText('Create API Key')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Copy Test' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('mw_copy_this_key')).toBeInTheDocument();
      });

      // Find the copy button (outline variant button with an SVG icon)
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(
        (btn) =>
          btn.querySelector('svg') &&
          !btn.textContent?.includes('Done')
      );
      expect(copyButton).toBeDefined();
      fireEvent.click(copyButton!);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'mw_copy_this_key'
        );
      });
    });
  });

  describe('Revoke Key', () => {
    it('should call revokeApiKeyAction when revoke button is clicked', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [mockActiveKey],
      });
      vi.mocked(apiKeysActions.revokeApiKeyAction).mockResolvedValue({
        success: true,
        message: 'Revoked.',
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('My CLI Key')).toBeInTheDocument();
      });

      const revokeButton = screen.getByRole('button', { name: /revoke/i });
      fireEvent.click(revokeButton);

      await waitFor(() => {
        expect(apiKeysActions.revokeApiKeyAction).toHaveBeenCalledWith('key-1');
      });
    });

    it('should reload keys after revoking', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction)
        .mockResolvedValueOnce({ success: true, keys: [mockActiveKey] })
        .mockResolvedValueOnce({ success: true, keys: [{ ...mockActiveKey, isActive: false }] });
      vi.mocked(apiKeysActions.revokeApiKeyAction).mockResolvedValue({
        success: true,
        message: 'Revoked.',
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(screen.getByText('My CLI Key')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /revoke/i }));

      await waitFor(() => {
        expect(apiKeysActions.listApiKeysAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle failed listApiKeysAction gracefully', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: false,
        message: 'Failed to load API keys.',
        keys: [],
      });
      render(<ApiKeysManager />);
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
    });

    it('should show the API Keys heading and description', async () => {
      vi.mocked(apiKeysActions.listApiKeysAction).mockResolvedValue({
        success: true,
        keys: [],
      });
      render(<ApiKeysManager />);
      expect(screen.getByText('API Keys')).toBeInTheDocument();
      expect(
        screen.getByText(/use api keys to access mindweave programmatically/i)
      ).toBeInTheDocument();
      // Wait for async loadKeys to settle
      await waitFor(() => {
        expect(
          screen.getByText('No API keys yet. Create one to get started.')
        ).toBeInTheDocument();
      });
    });
  });
});
