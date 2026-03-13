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
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

type NavSection = {
  label?: string;
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
    items: [
      { href: '/dashboard/ask', label: 'Ask AI', icon: MessageCircleQuestion },
      { href: '/dashboard/brain-dump', label: 'Brain Dump', icon: Wand2 },
      { href: '/dashboard/review', label: 'Review', icon: ClipboardCheck },
      { href: '/dashboard/discover', label: 'Discover', icon: Compass },
    ],
  },
  {
    label: 'Create & Share',
    items: [
      { href: '/dashboard/create-post', label: 'Create Post', icon: PenSquare },
      { href: '/til', label: 'TIL Feed', icon: Lightbulb },
      { href: '/marketplace', label: 'Marketplace', icon: Store },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/dashboard/study', label: 'Study', icon: BrainCircuit },
      { href: '/dashboard/learning-paths', label: 'Paths', icon: Route },
      { href: '/dashboard/badges', label: 'Badges', icon: Award },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/dashboard/graph', label: 'Graph', icon: Network },
      { href: '/dashboard/connections', label: 'Connections', icon: Zap },
      { href: '/dashboard/wrapped', label: 'Wrapped', icon: Gift },
    ],
  },
  {
    label: 'Manage',
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
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <span
        className={`bg-primary absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-200 ${
          isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        aria-hidden="true"
      />
      <Icon
        className={`h-4 w-4 transition-all duration-200 ${
          isActive
            ? 'text-primary'
            : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
        }`}
      />
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
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground/60 hover:text-muted-foreground flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        {section.label}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
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
    <nav className="border-border/50 bg-background/60 hidden w-64 border-r p-4 backdrop-blur-xl lg:block">
      <NavLinks />
    </nav>
  );
}
