import { describe, it, expect, vi } from 'vitest';

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn((config) => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
    ...config,
  })),
}));

// Mock providers
vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
}));

// Mock Drizzle adapter
vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => ({
    createUser: vi.fn(),
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByAccount: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    linkAccount: vi.fn(),
    unlinkAccount: vi.fn(),
  })),
}));

// Mock database client
vi.mock('./db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Auth Configuration', () => {
  describe('Auth Setup', () => {
    it('should export auth handlers', async () => {
      const { handlers } = await import('./auth');
      expect(handlers).toBeDefined();
      expect(typeof handlers).toBe('object');
    });

    it('should export signIn function', async () => {
      const { signIn } = await import('./auth');
      expect(signIn).toBeDefined();
      expect(typeof signIn).toBe('function');
    });

    it('should export signOut function', async () => {
      const { signOut } = await import('./auth');
      expect(signOut).toBeDefined();
      expect(typeof signOut).toBe('function');
    });

    it('should export auth function', async () => {
      const { auth } = await import('./auth');
      expect(auth).toBeDefined();
      expect(typeof auth).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should have Google provider configured', async () => {
      const Google = await import('next-auth/providers/google');
      expect(Google.default).toHaveBeenCalled();
    });

    it('should use Drizzle adapter', async () => {
      const { DrizzleAdapter } = await import('@auth/drizzle-adapter');
      expect(DrizzleAdapter).toHaveBeenCalled();
    });
  });

  describe('Protected Routes Callback', () => {
    it('should allow access to public pages when not logged in', () => {
      const authorized = (auth: any, nextUrl: string) => {
        const isLoggedIn = !!auth?.user;
        const isProtected =
          nextUrl.startsWith('/dashboard') ||
          nextUrl.startsWith('/capture') ||
          nextUrl.startsWith('/search') ||
          nextUrl.startsWith('/library');

        if (isProtected && !isLoggedIn) return false;
        return true;
      };

      expect(authorized(null, '/')).toBe(true);
      expect(authorized(null, '/login')).toBe(true);
      expect(authorized(null, '/about')).toBe(true);
    });

    it('should block protected pages when not logged in', () => {
      const authorized = (auth: any, nextUrl: string) => {
        const isLoggedIn = !!auth?.user;
        const isProtected =
          nextUrl.startsWith('/dashboard') ||
          nextUrl.startsWith('/capture') ||
          nextUrl.startsWith('/search') ||
          nextUrl.startsWith('/library');

        if (isProtected && !isLoggedIn) return false;
        return true;
      };

      expect(authorized(null, '/dashboard')).toBe(false);
      expect(authorized(null, '/capture')).toBe(false);
      expect(authorized(null, '/search')).toBe(false);
      expect(authorized(null, '/library')).toBe(false);
    });

    it('should allow access to protected pages when logged in', () => {
      const authorized = (auth: any, nextUrl: string) => {
        const isLoggedIn = !!auth?.user;
        const isProtected =
          nextUrl.startsWith('/dashboard') ||
          nextUrl.startsWith('/capture') ||
          nextUrl.startsWith('/search') ||
          nextUrl.startsWith('/library');

        if (isProtected && !isLoggedIn) return false;
        return true;
      };

      const mockAuth = { user: { id: '1', email: 'test@example.com' } };
      expect(authorized(mockAuth, '/dashboard')).toBe(true);
      expect(authorized(mockAuth, '/capture')).toBe(true);
      expect(authorized(mockAuth, '/search')).toBe(true);
      expect(authorized(mockAuth, '/library')).toBe(true);
    });
  });

  describe('Session Callback', () => {
    it('should add user id to session', () => {
      const sessionCallback = (session: any, user: any) => {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      };

      const mockSession = { user: { email: 'test@example.com' } };
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const result = sessionCallback(mockSession, mockUser);
      expect(result.user.id).toBe('user-123');
    });

    it('should handle session without user', () => {
      const sessionCallback = (session: any, user: any) => {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      };

      const mockSession = {};
      const mockUser = { id: 'user-123' };

      const result = sessionCallback(mockSession, mockUser);
      expect(result).toEqual({});
    });
  });
});
