'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  PlusCircle,
  Search,
  Library,
  MessageCircleQuestion,
  Upload,
  BarChart3,
  User,
  CheckSquare,
  Compass,
  Network,
  PenSquare,
  Gift,
  Zap,
  Store,
  Lightbulb,
  Award,
  BrainCircuit,
  Route,
  Wand2,
  ClipboardCheck,
  ChevronDown,
  Sparkles,
  Share2,
  GraduationCap,
  Globe,
  Settings,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

type NavSection = {
  label?: string;
  icon?: typeof Home;
  color?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/dashboard/library', label: 'Library', icon: Library },
      { href: '/dashboard/capture', label: 'Capture', icon: PlusCircle },
      { href: '/dashboard/search', label: 'Search', icon: Search },
    ],
  },
  {
    label: 'AI Tools',
    icon: Sparkles,
    color: 'text-violet-500',
    items: [
      { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion },
      { href: '/dashboard/brain-dump', label: 'Brain Dump', icon: Wand2 },
      { href: '/dashboard/review', label: 'Review', icon: ClipboardCheck },
      { href: '/dashboard/discover', label: 'Discover', icon: Compass },
    ],
  },
  {
    label: 'Create & Share',
    icon: Share2,
    color: 'text-blue-500',
    items: [
      { href: '/dashboard/create-post', label: 'Create Post', icon: PenSquare },
      { href: '/til', label: 'TIL Feed', icon: Lightbulb },
      { href: '/marketplace', label: 'Marketplace', icon: Store },
    ],
  },
  {
    label: 'Learn',
    icon: GraduationCap,
    color: 'text-emerald-500',
    items: [
      { href: '/dashboard/study', label: 'Study', icon: BrainCircuit },
      { href: '/dashboard/learning-paths', label: 'Paths', icon: Route },
      { href: '/dashboard/badges', label: 'Badges', icon: Award },
    ],
  },
  {
    label: 'Explore',
    icon: Globe,
    color: 'text-amber-500',
    items: [
      { href: '/dashboard/graph', label: 'Graph', icon: Network },
      { href: '/dashboard/connections', label: 'Connections', icon: Zap },
      { href: '/dashboard/wrapped', label: 'Wrapped', icon: Gift },
    ],
  },
  {
    label: 'Manage',
    icon: Settings,
    color: 'text-slate-400',
    items: [
      { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/dashboard/import', label: 'Import', icon: Upload },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/profile', label: 'Profile', icon: User },
    ],
  },
];

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'from-primary/15 to-primary/5 text-primary bg-gradient-to-r shadow-sm'
          : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
      }`}
    >
      <span
        className={`bg-primary absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-200 ${
          isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        aria-hidden="true"
      />
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ${
          isActive ? 'bg-primary/10' : 'group-hover:bg-accent bg-transparent'
        }`}
      >
        <Icon
          className={`h-4 w-4 transition-all duration-200 ${
            isActive
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
          }`}
        />
      </div>
      <span className="transition-colors duration-200">{item.label}</span>
    </Link>
  );
}

function CollapsibleSection({
  section,
  pathname,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasActiveChild = section.items.some((item) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  if (!section.label) {
    return (
      <div className="space-y-0.5 pb-2">
        {section.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  const SectionIcon = section.icon;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground/70 hover:bg-accent/50 hover:text-muted-foreground group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        {SectionIcon && (
          <SectionIcon className={`h-3.5 w-3.5 ${section.color || 'text-muted-foreground/50'}`} />
        )}
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronDown
          className={`text-muted-foreground/40 h-3 w-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'mt-0.5 max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {navSections.map((section, i) => (
        <CollapsibleSection
          key={section.label || i}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export default function Nav() {
  return (
    <nav className="border-border/40 from-background to-muted/20 hidden w-64 border-r bg-gradient-to-b p-3 lg:block">
      <NavLinks />
    </nav>
  );
}
