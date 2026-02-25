'use client';

import { Users, BookOpen, Newspaper, GraduationCap, Lightbulb, FileText, type LucideIcon } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Users,
  BookOpen,
  Newspaper,
  GraduationCap,
  Lightbulb,
};

interface TemplateSelectorProps {
  onSelect: (templateId: string | null) => void;
  selectedTemplate: string | null;
}

export function TemplateSelector({ onSelect, selectedTemplate }: TemplateSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Template (Optional)</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Blank option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all',
            'hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            selectedTemplate === null
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
              : 'border-border bg-card hover:-translate-y-0.5'
          )}
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            selectedTemplate === null ? 'bg-primary/10' : 'bg-muted'
          )}>
            <FileText className={cn(
              'h-4 w-4 transition-colors',
              selectedTemplate === null ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <span className={cn(
            'font-medium transition-colors',
            selectedTemplate === null ? 'text-primary' : 'text-muted-foreground'
          )}>
            Blank
          </span>
        </button>

        {TEMPLATES.map((template) => {
          const Icon = iconMap[template.icon] || FileText;
          const isSelected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all',
                'hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:-translate-y-0.5'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                isSelected ? 'bg-primary/10' : 'bg-muted'
              )}>
                <Icon className={cn(
                  'h-4 w-4 transition-colors',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'font-medium transition-colors text-center leading-tight',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {template.name}
              </span>
              {template.defaultTags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                  {template.defaultTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
