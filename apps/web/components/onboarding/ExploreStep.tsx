'use client';

import { Search, Brain, Library, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Search',
    description: 'Find content with keyword or semantic search powered by AI embeddings.',
    href: '/dashboard/search',
  },
  {
    icon: Brain,
    title: 'Ask AI',
    description: 'Ask questions about your knowledge base and get AI-powered answers.',
    href: '/dashboard/ask',
  },
  {
    icon: Library,
    title: 'Library',
    description: 'Browse, filter, and organize all your saved content and collections.',
    href: '/dashboard/library',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track your knowledge growth with insights and statistics.',
    href: '/dashboard/analytics',
  },
];

export default function ExploreStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">Explore Features</h2>
      <p className="text-muted-foreground mb-6">
        Here are the key features you can explore once you get started.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-medium">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
