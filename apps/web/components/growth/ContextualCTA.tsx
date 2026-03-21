import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type CtaVariant = 'til' | 'marketplace' | 'share' | 'profile' | 'comparison';

interface ContextualCTAProps {
  variant: CtaVariant;
}

const CTA_CONFIG: Record<CtaVariant, { heading: string; body: string }> = {
  til: {
    heading: 'Start sharing what you learn',
    body: 'Publish your own TILs and join the community.',
  },
  marketplace: {
    heading: 'Clone this collection to your library',
    body: 'Sign up to save and organize knowledge your way.',
  },
  share: {
    heading: 'Save this to your Mindweave',
    body: 'Build your own AI-powered knowledge hub.',
  },
  profile: {
    heading: 'Build your public knowledge profile',
    body: 'Showcase your expertise and share what you know.',
  },
  comparison: {
    heading: 'Try Mindweave free',
    body: 'AI-powered knowledge management — no credit card required.',
  },
};

export function ContextualCTA({ variant }: ContextualCTAProps) {
  const { heading, body } = CTA_CONFIG[variant];

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <h3 className="text-card-foreground text-lg font-semibold">{heading}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      <div className="mt-4">
        <Link
          href="/auth/register"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all"
        >
          Get Started Free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
