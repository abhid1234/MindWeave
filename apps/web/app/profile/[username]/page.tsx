import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProfile } from '@/app/actions/profile';
import PublicProfile from '@/components/profile/PublicProfile';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if (!result.success || !result.profile) {
    return {
      title: 'Profile Not Found - Mindweave',
      description: 'This profile does not exist or is not public.',
    };
  }

  const { profile } = result;
  const displayName = profile.name ?? profile.username;
  const description = profile.bio ?? `${displayName}'s public knowledge collections on Mindweave`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${displayName} (@${profile.username}) - Mindweave`,
    description,
    openGraph: {
      title: `${displayName} (@${profile.username})`,
      description,
      type: 'profile',
      url: `${baseUrl}/profile/${profile.username}`,
      siteName: 'Mindweave',
    },
    twitter: {
      card: 'summary',
      title: `${displayName} (@${profile.username})`,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if (!result.success || !result.profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Mindweave
            </Link>
            <span className="text-sm text-muted-foreground">Public Profile</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <PublicProfile profile={result.profile} />
      </main>
    </div>
  );
}
