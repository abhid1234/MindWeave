import { BookOpen, Library, FileText, Users } from 'lucide-react';

interface SocialProofCountersProps {
  tilCount: number;
  collectionCount: number;
  noteCount: number;
  userCount: number;
}

const stats = [
  {
    key: 'tilCount' as const,
    label: 'TILs Published',
    Icon: BookOpen,
  },
  {
    key: 'collectionCount' as const,
    label: 'Collections Shared',
    Icon: Library,
  },
  {
    key: 'noteCount' as const,
    label: 'Notes Captured',
    Icon: FileText,
  },
  {
    key: 'userCount' as const,
    label: 'Knowledge Builders',
    Icon: Users,
  },
];

export function SocialProofCounters({
  tilCount,
  collectionCount,
  noteCount,
  userCount,
}: SocialProofCountersProps) {
  const values: Record<(typeof stats)[number]['key'], number> = {
    tilCount,
    collectionCount,
    noteCount,
    userCount,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ key, label, Icon }) => (
        <div
          key={key}
          className="bg-card flex flex-col items-center gap-2 rounded-xl border p-4 text-center shadow-sm"
        >
          <Icon className="text-primary h-6 w-6" aria-hidden="true" />
          <span className="text-2xl font-bold tabular-nums">{values[key].toLocaleString()}</span>
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
