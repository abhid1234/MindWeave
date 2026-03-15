'use client';

import Link from 'next/link';
import { Sparkles, PenLine, Link2, Upload, Compass, ArrowRight } from 'lucide-react';

const actions = [
  {
    href: '/dashboard/capture',
    label: 'Capture a Note',
    description: 'Write down an idea, thought, or learning',
    icon: PenLine,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-500/30',
  },
  {
    href: '/dashboard/capture',
    label: 'Save a Link',
    description: 'Paste a URL to save and auto-summarize',
    icon: Link2,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-500/30',
  },
  {
    href: '/dashboard/import',
    label: 'Import Content',
    description: 'Bring in bookmarks or files from other tools',
    icon: Upload,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
    borderHover: 'hover:border-green-500/30',
  },
  {
    href: '/dashboard/discover',
    label: 'Explore Features',
    description: 'See what Mindweave can do for you',
    icon: Compass,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    borderHover: 'hover:border-violet-500/30',
  },
];

export function OnboardingWelcome() {
  return (
    <div className="space-y-4">
      <div
        className="animate-fade-up via-primary/5 dark:via-primary/5 rounded-2xl border bg-gradient-to-br from-violet-50 to-transparent p-6 dark:from-violet-950/20"
        style={{ animationFillMode: 'backwards' }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 shadow-sm">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Let&apos;s build your knowledge hub</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Start by capturing your first piece of knowledge — notes, links, files, anything you
              want to remember and rediscover.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <Link
            key={action.label}
            href={action.href}
            className={`bg-card animate-fade-up hover:shadow-soft-md group flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${action.borderHover}`}
            style={{ animationDelay: `${(i + 1) * 75}ms`, animationFillMode: 'backwards' }}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}
            >
              <action.icon className={`h-5 w-5 ${action.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{action.label}</h3>
              <p className="text-muted-foreground text-xs">{action.description}</p>
            </div>
            <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
