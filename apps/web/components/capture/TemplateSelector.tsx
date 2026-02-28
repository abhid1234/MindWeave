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
      <label className="block text-sm font-medium mb-2">Template</label>
      <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
        {/* Blank option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all whitespace-nowrap flex-shrink-0',
            'hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            selectedTemplate === null
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
              : 'border-border bg-card hover:bg-accent/50'
          )}
        >
          <FileText className={cn(
            'h-3.5 w-3.5 flex-shrink-0 transition-colors',
            selectedTemplate === null ? 'text-primary' : 'text-muted-foreground'
          )} />
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
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all whitespace-nowrap flex-shrink-0',
                'hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:bg-accent/50'
              )}
            >
              <Icon className={cn(
                'h-3.5 w-3.5 flex-shrink-0 transition-colors',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'font-medium transition-colors',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {template.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
