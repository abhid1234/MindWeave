import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProfile } from '@/app/actions/profile';
import ProfileSettingsForm from '@/components/profile/ProfileSettingsForm';
import { ApiKeysManager } from '@/components/profile/ApiKeysManager';
import { DigestSettingsForm } from '@/components/profile/DigestSettingsForm';
import { WebhookManager } from '@/components/profile/WebhookManager';
import { User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile | Mindweave',
  description: 'Manage your public profile and visibility settings',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const result = await getProfile();
  if (!result.success || !result.profile) {
    redirect('/dashboard');
  }

  const { profile } = result;

  return (
    <div>
      <div className="mb-6 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your public profile and visibility settings.
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <ProfileSettingsForm
          initialData={{
            username: profile.username,
            bio: profile.bio,
            isProfilePublic: profile.isProfilePublic,
          }}
        />
      </div>

      <div className="mt-8 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <div className="rounded-xl border bg-card p-6">
          <ApiKeysManager />
        </div>
      </div>

      <div className="mt-8 animate-fade-up" style={{ animationDelay: '225ms', animationFillMode: 'backwards' }}>
        <div className="rounded-xl border bg-card p-6">
          <DigestSettingsForm />
        </div>
      </div>

      <div className="mt-8 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <div className="rounded-xl border bg-card p-6">
          <WebhookManager />
        </div>
      </div>
    </div>
  );
}
