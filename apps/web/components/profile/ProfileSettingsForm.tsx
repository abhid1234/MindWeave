'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/actions/profile';

interface ProfileSettingsFormProps {
  initialData: {
    username: string | null;
    bio: string | null;
    isProfilePublic: boolean;
  };
}

export default function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const [username, setUsername] = useState(initialData.username ?? '');
  const [bio, setBio] = useState(initialData.bio ?? '');
  const [isPublic, setIsPublic] = useState(initialData.isProfilePublic);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const result = await updateProfile({
      username: username || null,
      bio: bio || null,
      isProfilePublic: isPublic,
    });

    setSaving(false);
    if (result.success) {
      setMessage('Profile updated successfully');
    } else {
      setError(result.message);
    }
  }

  const profileUrl = username
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${username}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="your-username"
          pattern="^[a-z0-9_-]+$"
          minLength={3}
          maxLength={50}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Lowercase letters, numbers, hyphens, and underscores only. 3-50 characters.
        </p>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell others about yourself..."
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <label htmlFor="isPublic" className="text-sm font-medium">
          Make profile public
        </label>
      </div>

      {isPublic && profileUrl && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            Your public profile URL:{' '}
            <a href={profileUrl} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {profileUrl}
            </a>
          </p>
        </div>
      )}

      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
