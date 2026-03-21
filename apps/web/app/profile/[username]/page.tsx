import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPublicProfile } from '@/app/actions/profile';
import { getSocialProofStats } from '@/app/actions/social-proof';
import PublicProfile from '@/components/profile/PublicProfile';
import { JsonLd } from '@/components/seo/JsonLd';
import { ContextualCTA } from '@/components/growth/ContextualCTA';
import { SignupBanner } from '@/components/growth/SignupBanner';

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
  const [session, result, stats] = await Promise.all([
    auth(),
    getPublicProfile(username),
    getSocialProofStats(),
  ]);

  if (!result.success || !result.profile) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { profile } = result;
  const displayName = profile.name ?? profile.username;

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    url: `${baseUrl}/profile/${profile.username}`,
    description: profile.bio ?? `${displayName}'s public knowledge collections on Mindweave`,
  };

  return (
    <>
      <JsonLd data={personJsonLd} />
      <div className="bg-background min-h-screen">
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                Mindweave
              </Link>
              <span className="text-muted-foreground text-sm">Public Profile</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
          <PublicProfile profile={profile} />
          {!session?.user && <ContextualCTA variant="profile" />}
        </main>
      </div>

      {!session?.user && stats?.data && <SignupBanner userCount={stats.data.userCount} />}
    </>
  );
}
