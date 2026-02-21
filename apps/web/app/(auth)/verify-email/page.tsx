import Link from 'next/link';
import { redirect } from 'next/navigation';
import { consumeVerificationToken } from '@/lib/email';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';


export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const { token, email } = params;

  if (!token || !email) {
    return (
      <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
        <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
          <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
            <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
            <p className="mt-2 text-sm text-muted-foreground">Invalid verification link</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
            This verification link is invalid. Please request a new one.
          </div>
          <p className="text-center text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <Link href="/verify-email-sent" className="font-medium text-primary hover:text-primary/80">
              Resend verification email
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const consumed = await consumeVerificationToken(email, token);

  if (!consumed) {
    return (
      <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
        <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
          <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
            <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
            <p className="mt-2 text-sm text-muted-foreground">Link expired</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
            This verification link has expired or already been used. Please request a new one.
          </div>
          <p className="text-center text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <Link href="/verify-email-sent" className="font-medium text-primary hover:text-primary/80">
              Resend verification email
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  // Look up user to get password for auto sign-in
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (user?.password) {
    // For credentials users, we can't auto sign-in without the password
    // Redirect to login with a success message
    redirect('/login?verified=true');
  }

  redirect('/login?verified=true');
}
