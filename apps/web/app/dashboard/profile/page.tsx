import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProfile } from '@/app/actions/profile';
import ProfileSettingsForm from '@/components/profile/ProfileSettingsForm';

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your public profile and visibility settings.
        </p>
      </div>

      <ProfileSettingsForm
        initialData={{
          username: profile.username,
          bio: profile.bio,
          isProfilePublic: profile.isProfilePublic,
        }}
      />
    </div>
  );
}
