export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const docsNavConfig: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Introduction', href: '/docs' },
      { label: 'Getting Started', href: '/docs/getting-started' },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'Features Overview', href: '/docs/features' },
      {
        label: 'Content Capture',
        href: '/docs/features/capture',
      },
      {
        label: 'Content Library',
        href: '/docs/features/library',
      },
      {
        label: 'Tagging',
        href: '/docs/features/tagging',
      },
      {
        label: 'Search',
        href: '/docs/features/search',
      },
      {
        label: 'Knowledge Q&A',
        href: '/docs/features/ask',
      },
      {
        label: 'Collections',
        href: '/docs/features/collections',
      },
      {
        label: 'Analytics',
        href: '/docs/features/analytics',
      },
    ],
  },
  {
    label: 'More',
    items: [
      { label: 'Account & Settings', href: '/docs/account' },
      { label: 'FAQ', href: '/docs/faq' },
    ],
  },
];

export function flattenNavItems(): NavItem[] {
  return docsNavConfig.flatMap((section) =>
    section.items.flatMap((item) =>
      item.children ? [item, ...item.children] : [item]
    )
  );
}

export function findBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [{ label: 'Docs', href: '/docs' }];

  if (pathname === '/docs') return crumbs;

  for (const section of docsNavConfig) {
    for (const item of section.items) {
      if (item.href === pathname) {
        if (section.label === 'Features' && item.href !== '/docs/features') {
          crumbs.push({ label: 'Features', href: '/docs/features' });
        }
        crumbs.push({ label: item.label, href: item.href });
        return crumbs;
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.href === pathname) {
            crumbs.push({ label: item.label, href: item.href });
            crumbs.push({ label: child.label, href: child.href });
            return crumbs;
          }
        }
      }
    }
  }

  return crumbs;
}
