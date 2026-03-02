'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Copy, LogIn, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cloneCollectionAction } from '@/app/actions/marketplace';
import { useToast } from '@/components/ui/toast';

interface CloneButtonProps {
  listingId: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CloneButton({ listingId, size = 'default', className }: CloneButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [isCloning, setIsCloning] = useState(false);
  const [cloned, setCloned] = useState(false);

  if (!session) {
    return (
      <Button
        size={size}
        className={className}
        onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))}
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign up to clone
      </Button>
    );
  }

  if (cloned) {
    return (
      <Button size={size} className={className} variant="outline" disabled>
        <Check className="mr-2 h-4 w-4" />
        Cloned
      </Button>
    );
  }

  const handleClone = async () => {
    setIsCloning(true);
    try {
      const result = await cloneCollectionAction(listingId);
      if (result.success) {
        setCloned(true);
        addToast({
          variant: 'success',
          title: 'Collection cloned!',
          description: 'View it in your library.',
        });
        if (result.collectionId) {
          router.push(`/dashboard/library?collectionId=${result.collectionId}`);
        }
      } else {
        addToast({ variant: 'error', title: result.message });
      }
    } catch {
      addToast({ variant: 'error', title: 'Failed to clone collection' });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Button size={size} className={className} onClick={handleClone} disabled={isCloning}>
      {isCloning ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {isCloning ? 'Cloning...' : 'Clone to My Library'}
    </Button>
  );
}
