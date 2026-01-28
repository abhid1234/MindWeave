'use client';

import { BookOpen, Search, Brain, Library } from 'lucide-react';

export default function WelcomeStep() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-2">Welcome to Mindweave</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Your AI-powered personal knowledge hub. Capture ideas, organize knowledge, and rediscover insights.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
        {[
          { icon: BookOpen, title: 'Capture', desc: 'Save notes, links, and files in one place' },
          { icon: Search, title: 'Search', desc: 'Find anything with keyword or semantic search' },
          { icon: Brain, title: 'Ask AI', desc: 'Query your knowledge base with natural language' },
          { icon: Library, title: 'Organize', desc: 'Tag, collect, and browse your content' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-lg border p-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
