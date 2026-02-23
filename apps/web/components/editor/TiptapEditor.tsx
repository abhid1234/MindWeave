'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

const lowlight = createLowlight(common);

type TiptapEditorProps = {
  content?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
};

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  disabled = false,
  minHeight = '200px',
}: TiptapEditorProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown() as string;
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-semibold prose-headings:leading-tight',
          'prose-p:leading-relaxed prose-p:my-1',
          'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm',
          'prose-pre:rounded-lg prose-pre:bg-muted',
          'prose-blockquote:border-l-primary/50',
          'prose-a:text-primary prose-a:underline',
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
          '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
          '[&_ul[data-type="taskList"]_li_label]:mt-0.5',
        ),
      },
    },
  });

  // Sync content prop changes (e.g. when dialog opens with new content)
  useEffect(() => {
    if (editor && content !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentMarkdown = (editor.storage as any).markdown?.getMarkdown() as string | undefined;
      if (currentMarkdown !== content) {
        isUpdatingRef.current = true;
        editor.commands.setContent(content);
        isUpdatingRef.current = false;
      }
    }
  }, [editor, content]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-input bg-background"
        style={{ minHeight }}
      >
        <div className="h-10 border-b bg-muted/30" />
        <div className="px-4 py-3 text-sm text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background overflow-hidden',
        'transition-all duration-200 ease-smooth',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-primary',
        'hover:border-primary/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <EditorToolbar editor={editor} />
      <div style={{ minHeight }} className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
