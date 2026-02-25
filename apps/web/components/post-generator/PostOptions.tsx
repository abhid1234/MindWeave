'use client';

import { Briefcase, MessageCircle, BookOpen } from 'lucide-react';

interface PostOptionsProps {
  tone: 'professional' | 'casual' | 'storytelling';
  length: 'short' | 'medium' | 'long';
  includeHashtags: boolean;
  onToneChange: (tone: 'professional' | 'casual' | 'storytelling') => void;
  onLengthChange: (length: 'short' | 'medium' | 'long') => void;
  onHashtagsChange: (include: boolean) => void;
}

const toneOptions = [
  { value: 'professional' as const, label: 'Professional', icon: Briefcase, desc: 'Authoritative & data-driven' },
  { value: 'casual' as const, label: 'Casual', icon: MessageCircle, desc: 'Conversational & relatable' },
  { value: 'storytelling' as const, label: 'Storytelling', icon: BookOpen, desc: 'Narrative with a hook' },
];

const lengthOptions = [
  { value: 'short' as const, label: 'Short', desc: '50-100 words' },
  { value: 'medium' as const, label: 'Medium', desc: '100-200 words' },
  { value: 'long' as const, label: 'Long', desc: '200-300 words' },
];

export function PostOptions({
  tone,
  length,
  includeHashtags,
  onToneChange,
  onLengthChange,
  onHashtagsChange,
}: PostOptionsProps) {
  return (
    <div className="space-y-6">
      {/* Tone selection */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Tone</h3>
        <div className="grid grid-cols-3 gap-3">
          {toneOptions.map((option) => {
            const Icon = option.icon;
            const isActive = tone === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onToneChange(option.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Length selection */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Length</h3>
        <div className="flex gap-2">
          {lengthOptions.map((option) => {
            const isActive = length === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onLengthChange(option.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-center transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hashtags toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Include Hashtags</h3>
          <p className="text-xs text-muted-foreground">Add relevant hashtags to your post</p>
        </div>
        <button
          onClick={() => onHashtagsChange(!includeHashtags)}
          role="switch"
          aria-checked={includeHashtags}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            includeHashtags ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
              includeHashtags ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
