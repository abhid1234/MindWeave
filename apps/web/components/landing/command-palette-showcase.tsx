'use client';

import {
  Command,
  Search,
  Zap,
  Clock,
  Palette,
  Home,
  Library,
  MessageCircleQuestion,
  PlusCircle,
  Sun,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const features = [
  {
    icon: Search,
    label: 'Instant search across your entire knowledge base',
  },
  {
    icon: Zap,
    label: 'Quick navigation to any page with keyboard shortcuts',
  },
  {
    icon: Clock,
    label: 'Recently visited pages for fast context switching',
  },
  {
    icon: Palette,
    label: 'Theme switching (Light / Dark / System) in one click',
  },
  {
    icon: Command,
    label: 'Fast actions: New Note, Ask AI, Keyboard Help',
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function MockItem({
  icon: Icon,
  label,
  shortcut,
  rightIcon: RightIcon,
  highlighted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  rightIcon?: React.ComponentType<{ className?: string }>;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${highlighted ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
      {RightIcon && <RightIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />}
    </div>
  );
}

function MockGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground/70">
      {children}
    </div>
  );
}

function MockSeparator() {
  return <div className="my-1 h-px bg-border/50" />;
}

function PaletteMockup() {
  return (
    <div className="rounded-xl border border-border/50 bg-popover shadow-soft-lg overflow-hidden">
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <Command className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm text-muted-foreground/50">
          Search pages, actions, content…
        </span>
      </div>

      <div className="p-1.5">
        {/* Recent */}
        <MockGroupLabel>Recent</MockGroupLabel>
        <MockItem icon={Library} label="Library" rightIcon={Clock} />
        <MockItem icon={MessageCircleQuestion} label="Ask AI" rightIcon={Clock} />

        <MockSeparator />

        {/* Navigation */}
        <MockGroupLabel>Navigation</MockGroupLabel>
        <MockItem icon={Home} label="Dashboard" shortcut="H" highlighted />
        <MockItem icon={Search} label="Search" shortcut="S" />
        <MockItem icon={MessageCircleQuestion} label="Ask AI" shortcut="A" />
        <MockItem icon={Library} label="Library" shortcut="L" />

        <MockSeparator />

        {/* Actions */}
        <MockGroupLabel>Actions</MockGroupLabel>
        <MockItem icon={PlusCircle} label="New Note" />
        <MockItem icon={Search} label="Search Knowledge" />
        <MockItem icon={Sun} label="Light Mode" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 border-t border-border/50 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground/60">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}

export function CommandPaletteShowcase() {
  return (
    <section className="bg-muted/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          {/* Heading */}
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                Command palette for{' '}
                <span className="text-gradient">power users</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Navigate, search, and take action without ever leaving your
                keyboard.
              </p>
            </div>
          </ScrollReveal>

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-[45%_55%] items-center">
            {/* Left — features */}
            <ScrollReveal>
              <div>
                <h3 className="text-xl font-semibold mb-6">
                  Everything at your{' '}
                  <span className="text-gradient">fingertips</span>
                  <span className="ml-2 inline-flex items-center gap-1 align-middle">
                    <Kbd>⌘</Kbd>
                    <span className="text-xs text-muted-foreground">+</span>
                    <Kbd>K</Kbd>
                  </span>
                </h3>

                <ul className="space-y-4">
                  {features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <li key={f.label} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed pt-1">
                          {f.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </ScrollReveal>

            {/* Right — mockup */}
            <ScrollReveal delay={150}>
              <div className="order-first lg:order-last">
                <PaletteMockup />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
