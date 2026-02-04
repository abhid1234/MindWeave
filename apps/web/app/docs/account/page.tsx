import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account & Settings',
  description: 'Manage your Mindweave account, profile, and security settings.',
};

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Account &amp; Settings</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Manage your profile, security settings, and account preferences in Mindweave.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your profile includes your name and email address. If you signed up via Google OAuth,
          your profile information is pulled from your Google account automatically.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          To update your profile:
        </p>
        <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
          <li>Navigate to <strong>Settings</strong> from the user menu.</li>
          <li>Edit your display name or other profile fields.</li>
          <li>Click <strong>Save</strong> to apply changes.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Authentication</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mindweave supports two authentication methods:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Google OAuth</strong> — Sign in with your Google account. This is the primary
            authentication method and is set up automatically during registration.
          </li>
          <li>
            <strong>Email &amp; password</strong> — You can also register with an email address
            and password. Email verification is required to activate your account.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Email Verification</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you register with email and password, you&apos;ll receive a verification email
          to confirm your email address. Click the verification link in the email to activate
          your account. You can request a new verification email from the login page if the
          original expires.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Security</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mindweave takes security seriously:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Passwords are hashed using industry-standard algorithms.</li>
          <li>Sessions are managed with secure, HTTP-only cookies.</li>
          <li>All API endpoints are protected with authentication checks.</li>
          <li>Rate limiting is applied to prevent abuse.</li>
          <li>CSRF protection is enabled on all form submissions.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data &amp; Privacy</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your content is stored securely in a PostgreSQL database. AI features send content
          to Google Gemini for processing (auto-tagging, embeddings, Q&amp;A), but your data is
          not used for model training. For full details, see the{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Deleting Your Account</h2>
        <p className="text-muted-foreground leading-relaxed">
          To delete your account and all associated data, contact support at{' '}
          <a href="mailto:das.abhijit34@gmail.com" className="text-primary hover:underline">
            das.abhijit34@gmail.com
          </a>.
          Account deletion is permanent and removes all your content, tags, embeddings,
          and collections.
        </p>
      </section>
    </div>
  );
}
