'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FavoritesToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const favoritesOnly = searchParams.get('favorites') === 'true';

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (favoritesOnly) {
      params.delete('favorites');
    } else {
      params.set('favorites', 'true');
    }
    router.push(`/dashboard/library?${params.toString()}`);
  };

  return (
    <Button
      variant={favoritesOnly ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2"
    >
      <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
      Favorites
    </Button>
  );
}
