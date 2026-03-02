import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CloneButton } from './CloneButton';
import * as marketplaceActions from '@/app/actions/marketplace';

// Mock next-auth
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock marketplace actions
vi.mock('@/app/actions/marketplace', () => ({
  cloneCollectionAction: vi.fn(),
}));

// Mock toast
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe('CloneButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/marketplace/listing-1' },
      writable: true,
    });
  });

  it('should show "Sign up to clone" when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<CloneButton listingId="listing-1" />);
    expect(screen.getByText('Sign up to clone')).toBeInTheDocument();
  });

  it('should redirect to login when unauthenticated user clicks', () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<CloneButton listingId="listing-1" />);
    fireEvent.click(screen.getByText('Sign up to clone'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/login?callbackUrl=')
    );
  });

  it('should show "Clone to My Library" when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
    });

    render(<CloneButton listingId="listing-1" />);
    expect(screen.getByText('Clone to My Library')).toBeInTheDocument();
  });

  it('should show success state after cloning', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
    });

    vi.mocked(marketplaceActions.cloneCollectionAction).mockResolvedValue({
      success: true,
      message: 'Cloned!',
      collectionId: 'new-col-1',
    });

    render(<CloneButton listingId="listing-1" />);
    fireEvent.click(screen.getByText('Clone to My Library'));

    await waitFor(() => {
      expect(screen.getByText('Cloned')).toBeInTheDocument();
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' })
    );
  });

  it('should show error toast on failure', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
    });

    vi.mocked(marketplaceActions.cloneCollectionAction).mockResolvedValue({
      success: false,
      message: 'Cannot clone your own collection',
    });

    render(<CloneButton listingId="listing-1" />);
    fireEvent.click(screen.getByText('Clone to My Library'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error', title: 'Cannot clone your own collection' })
      );
    });
  });
});
