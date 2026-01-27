import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db/client';
import { users, accounts, sessions, verificationTokens } from './db/schema';

// SECURITY: Strict environment check for dev-only features
// Dev login is ONLY allowed when ALL of these conditions are true:
// 1. NODE_ENV is explicitly 'development'
// 2. ALLOW_DEV_LOGIN is explicitly set to 'true'
// 3. We're not running in a production-like environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProductionBuild = process.env.VERCEL_ENV === 'production' ||
                          process.env.RAILWAY_ENVIRONMENT === 'production' ||
                          process.env.GOOGLE_CLOUD_PROJECT !== undefined;
const allowDevLogin = isDevelopment &&
                      process.env.ALLOW_DEV_LOGIN === 'true' &&
                      !isProductionBuild;

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
      // SECURITY: Disabled dangerous email linking to prevent account takeover
      // If a user signs up with Google, they must continue using Google
      allowDangerousEmailAccountLinking: false,
    }),
    // Development-only test login (bypasses OAuth)
    // SECURITY: Only enabled when ALLOW_DEV_LOGIN=true AND NODE_ENV=development
    // This will NEVER be enabled in production builds
    ...(allowDevLogin
      ? [
          Credentials({
            id: 'dev-login',
            name: 'Dev Login',
            credentials: {
              email: { label: 'Email', type: 'email', placeholder: 'test@example.com' },
            },
            async authorize(credentials) {
              // SECURITY WARNING: This is for local development only!
              // It creates/returns a test user without password verification
              // Protected by allowDevLogin guard above
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
        // Use token.sub (set in jwt callback) as the user ID
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Store user ID in token.sub on sign in
      // token.sub is the standard JWT subject claim used for user ID
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt', // Use JWT for Edge Runtime compatibility
  },
});
