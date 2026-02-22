'use client';

export function HeroProductMockup() {
  return (
    <div className="hidden sm:block" aria-hidden="true">
      <div
        className="relative rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden"
        style={{ transform: 'perspective(1200px) rotateY(-3deg)', transformOrigin: 'left center' }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-background/60 px-3 py-1 text-[10px] text-muted-foreground">
            mindweave.space/dashboard
          </div>
        </div>

        {/* Dashboard body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden md:flex w-36 flex-col gap-1.5 border-r border-border/40 bg-muted/30 px-2.5 py-3">
            {['Library', 'Capture', 'Search', 'Ask AI'].map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                  i === 0
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-3.5">
            {/* Search bar */}
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5">
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-[11px] text-muted-foreground">Search by meaning...</span>
            </div>

            {/* Content cards */}
            <div className="space-y-2">
              {[
                { title: 'Productivity frameworks', type: 'note', color: 'bg-yellow-500', tags: ['productivity', 'habits'] },
                { title: 'Cal Newport — Deep Work', type: 'link', color: 'bg-green-500', tags: ['focus', 'books'] },
                { title: 'Project architecture doc', type: 'file', color: 'bg-purple-500', tags: ['engineering', 'design'] },
              ].map((card) => (
                <div key={card.title} className="rounded-lg border border-border/40 bg-background/60 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${card.color}`} />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {card.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium mb-1.5">{card.title}</p>
                  <div className="flex gap-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
