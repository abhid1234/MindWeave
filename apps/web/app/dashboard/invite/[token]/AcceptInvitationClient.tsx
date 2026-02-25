'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { acceptInvitationAction } from '@/app/actions/collection-sharing';
import { Button } from '@/components/ui/button';

type AcceptInvitationClientProps = {
  token: string;
};

export function AcceptInvitationClient({ token }: AcceptInvitationClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    acceptInvitationAction(token).then((result) => {
      if (cancelled) return;
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);
    }).catch(() => {
      if (!cancelled) {
        setStatus('error');
        setMessage('Something went wrong');
      }
    });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Accepting invitation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <p className="font-medium">{message}</p>
            <Button onClick={() => router.push('/dashboard/library')}>
              Go to Library
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{message}</p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
