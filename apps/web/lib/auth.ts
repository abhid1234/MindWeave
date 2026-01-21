import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db/client';
import { users, accounts, sessions, verificationTokens } from './db/schema';

const isDevelopment = process.env.NODE_ENV === 'development';

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Using JWT sessions for Edge Runtime compatibility
  // Sessions and verification tokens tables use integer (Unix timestamp) instead of timestamp
  // to work with Edge Runtime. TypeScript types expect timestamp, but runtime works fine.
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    // @ts-expect-error - Using integer for expires (Unix timestamp) instead of timestamp for Edge Runtime
    sessionsTable: sessions,
    // @ts-expect-error - Using integer for expires (Unix timestamp) instead of timestamp for Edge Runtime
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    // Development-only test login (bypasses OAuth)
    ...(isDevelopment
      ? [
          Credentials({
            id: 'dev-login',
            name: 'Dev Login',
            credentials: {
              email: { label: 'Email', type: 'email', placeholder: 'test@example.com' },
            },
            async authorize(credentials) {
              // WARNING: This is for development only!
              // It creates/returns a test user without password verification
              if (!credentials?.email) return null;

              // Check if user exists
              const existingUser = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, credentials.email as string),
              });

              if (existingUser) {
                return {
                  id: existingUser.id,
                  email: existingUser.email,
                  name: existingUser.name,
                  image: existingUser.image,
                };
              }

              // Create a new test user
              const [newUser] = await db
                .insert(users)
                .values({
                  email: credentials.email as string,
                  name: (credentials.email as string).split('@')[0],
                  emailVerified: new Date(),
                })
                .returning();

              return {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                image: newUser.image,
              };
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
    async session({ session, token }) {
      // Add user ID to session from JWT token
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Store user ID in token on sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt', // Use JWT for Edge Runtime compatibility
  },
});
