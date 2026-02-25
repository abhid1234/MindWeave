'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { generatePostAction } from '@/app/actions/post-generator';
import { ContentSelector } from './ContentSelector';
import { PostOptions } from './PostOptions';
import { PostPreview } from './PostPreview';
import { PostHistory } from './PostHistory';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
  createdAt: Date;
}

type ActiveTab = 'generate' | 'history';
type Step = 'select' | 'options' | 'preview';

export function PostGenerator() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');
  const [step, setStep] = useState<Step>('select');
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [tone, setTone] = useState<'professional' | 'casual' | 'storytelling'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generatedPost, setGeneratedPost] = useState<{
    postContent: string;
    sourceContentTitles: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generatePostAction({
        contentIds: selectedContent.map((c) => c.id),
        tone,
        length,
        includeHashtags,
      });

      if (result.success && result.post) {
        setGeneratedPost({
          postContent: result.post.postContent,
          sourceContentTitles: result.post.sourceContentTitles,
        });
        setStep('preview');
        addToast({ title: 'Post generated!', variant: 'success' });
      } else {
        addToast({ title: result.message || 'Failed to generate post', variant: 'error' });
      }
    });
  }

  function handleRegenerate() {
    handleGenerate();
  }

  function handleBackToOptions() {
    setStep('options');
  }

  function handleReset() {
    setStep('select');
    setGeneratedPost(null);
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab('generate'); handleReset(); }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'generate'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'history' ? (
          <PostHistory />
        ) : step === 'preview' && generatedPost ? (
          <PostPreview
            postContent={generatedPost.postContent}
            sourceContentTitles={generatedPost.sourceContentTitles}
            onRegenerate={handleRegenerate}
            onBack={handleBackToOptions}
            isRegenerating={isPending}
          />
        ) : step === 'options' ? (
          <div className="space-y-6">
            <PostOptions
              tone={tone}
              length={length}
              includeHashtags={includeHashtags}
              onToneChange={setTone}
              onLengthChange={setLength}
              onHashtagsChange={setIncludeHashtags}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep('select')}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Post
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ContentSelector
              selectedItems={selectedContent}
              onSelectionChange={setSelectedContent}
            />
            <button
              onClick={() => setStep('options')}
              disabled={selectedContent.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Continue ({selectedContent.length} selected)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
