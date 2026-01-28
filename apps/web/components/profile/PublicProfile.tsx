import Image from 'next/image';
import PublicCollectionCard from './PublicCollectionCard';

interface PublicProfileProps {
  profile: {
    name: string | null;
    image: string | null;
    username: string;
    bio: string | null;
    createdAt: Date;
    publicCollections: {
      id: string;
      name: string;
      description: string | null;
      color: string | null;
      contentCount: number;
    }[];
  };
}

export default function PublicProfile({ profile }: PublicProfileProps) {
  return (
    <div>
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        {profile.image ? (
          <Image
            src={profile.image}
            alt={profile.name ?? profile.username}
            width={80}
            height={80}
            className="rounded-full"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {(profile.name ?? profile.username).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name ?? profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-muted-foreground mb-8 max-w-xl">{profile.bio}</p>
      )}

      {/* Public collections */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Public Collections</h2>
        {profile.publicCollections.length === 0 ? (
          <p className="text-muted-foreground">No public collections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.publicCollections.map((collection) => (
              <PublicCollectionCard
                key={collection.id}
                collection={collection}
                username={profile.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
