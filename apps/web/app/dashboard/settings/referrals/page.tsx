import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getReferralStats } from '@/app/actions/referrals';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { Link2 } from 'lucide-react';

export default async function ReferralsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const stats = await getReferralStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Link2 className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Referrals</h1>
          <p className="text-muted-foreground text-sm">
            Invite friends to Mindweave and earn badges
          </p>
        </div>
      </div>

      {stats.success && stats.referralLink ? (
        <ReferralDashboard
          referralLink={stats.referralLink}
          totalClicks={stats.totalClicks ?? 0}
          totalSignups={stats.totalSignups ?? 0}
          totalActivated={stats.totalActivated ?? 0}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {stats.message ?? 'Unable to load referral stats. Please try again later.'}
          </p>
        </div>
      )}
    </div>
  );
}
