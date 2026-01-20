import { describe, it, expect, vi } from 'vitest';
import { signOutAction } from './auth';
import * as authModule from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn(),
}));

describe('signOutAction', () => {
  it('should call signOut with redirect to home page', async () => {
    const mockSignOut = vi.spyOn(authModule, 'signOut' as any);

    await signOutAction();

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
  });
});
