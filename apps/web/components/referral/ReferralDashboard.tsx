'use client';

import { useState } from 'react';
import { MousePointerClick, UserPlus, UserCheck, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShareButton } from '@/components/growth/ShareButton';

interface ReferralDashboardProps {
  referralLink: string;
  totalClicks: number;
  totalSignups: number;
  totalActivated: number;
}

export function ReferralDashboard({
  referralLink,
  totalClicks,
  totalSignups,
  totalActivated,
}: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <div className="space-y-6">
      {/* Referral link section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="font-mono text-sm"
              aria-label="Referral link"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label="Copy referral link"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              url={referralLink}
              title="Join me on Mindweave — an AI-powered personal knowledge hub"
              description="Capture, organize, and rediscover your ideas with AI assistance"
            />
            <p className="text-muted-foreground text-xs">
              Share your link and earn badges when your friends join
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClicks}</p>
              <p className="text-muted-foreground text-sm">Link Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSignups}</p>
              <p className="text-muted-foreground text-sm">Signups</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActivated}</p>
              <p className="text-muted-foreground text-sm">Activated</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
