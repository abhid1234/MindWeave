import Link from 'next/link';
import {
  Sparkles,
  Search,
  Brain,
  BookOpen,
  Zap,
  Star,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

// --- Icon mapping ---

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Search,
  Brain,
  BookOpen,
  Zap,
  Star,
};

// --- Types ---

export interface LandingPageFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingPageData {
  hero: {
    title: string;
    subtitle: string;
    cta: {
      text: string;
      href: string;
    };
  };
  problem: {
    title: string;
    paragraphs: string[];
  };
  solution: {
    title: string;
    description: string;
  };
  features: LandingPageFeature[];
  socialProof: {
    githubStars: number;
    testCount: string;
  };
}

interface LandingPageTemplateProps {
  data: LandingPageData;
}

// --- Sub-components ---

function HeroSection({ hero }: { hero: LandingPageData['hero'] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="from-primary/5 to-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent" />
      <div className="container relative mx-auto px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{hero.title}</h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8 sm:text-xl">
          {hero.subtitle}
        </p>
        <div className="mt-10">
          <Link
            href={hero.cta.href}
            className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-lg px-8 py-3 font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            {hero.cta.text}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProblemSection({ problem }: { problem: LandingPageData['problem'] }) {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">{problem.title}</h2>
          <div className="space-y-4">
            {problem.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection({ solution }: { solution: LandingPageData['solution'] }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">{solution.title}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{solution.description}</p>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: LandingPageFeature }) {
  const Icon = ICON_MAP[feature.icon] ?? Sparkles;
  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <div className="bg-primary/10 border-primary/20 mb-4 inline-flex rounded-lg border p-2.5">
        <Icon className="text-primary h-5 w-5" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
    </div>
  );
}

function FeaturesSection({ features }: { features: LandingPageFeature[] }) {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofBar({ socialProof }: { socialProof: LandingPageData['socialProof'] }) {
  return (
    <section className="border-border/50 border-y py-8">
      <div className="container mx-auto px-4">
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            {socialProof.githubStars} GitHub stars
          </span>
          <span className="text-border">|</span>
          <span>{socialProof.testCount} tests passing</span>
          <span className="text-border">|</span>
          <span>Open source &amp; free</span>
        </div>
      </div>
    </section>
  );
}

function BottomCta({ cta }: { cta: LandingPageData['hero']['cta'] }) {
  return (
    <section className="from-primary/10 via-primary/5 bg-gradient-to-br to-transparent py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
          Start organizing your knowledge today
        </h2>
        <p className="text-muted-foreground mx-auto mb-10 max-w-lg text-lg">
          Free forever. No credit card required.
        </p>
        <Link
          href={cta.href}
          className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-lg px-8 py-3 font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        >
          {cta.text}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

// --- Main export ---

export function LandingPageTemplate({ data }: LandingPageTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection hero={data.hero} />
        <ProblemSection problem={data.problem} />
        <SolutionSection solution={data.solution} />
        <FeaturesSection features={data.features} />
        <SocialProofBar socialProof={data.socialProof} />
        <BottomCta cta={data.hero.cta} />
      </main>
    </div>
  );
}
