'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { askQuestionAction } from '@/app/actions/search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    contentId: string;
    title: string;
    relevance: string;
  }>;
  sourcesUsed?: number;
  timestamp: Date;
};

export function KnowledgeQA() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setError(null);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');

    startTransition(async () => {
      const response = await askQuestionAction(trimmedQuestion);

      if (!response.success) {
        setError(response.message || 'Failed to get answer');
        return;
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer || '',
        citations: response.citations,
        sourcesUsed: response.sourcesUsed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">Knowledge Q&A</h2>
          <p className="text-xs text-muted-foreground">
            Ask questions about your saved content
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Ask anything about your knowledge base</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              I&apos;ll search through your notes, links, and files to find relevant information and provide an answer.
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p>Try asking:</p>
              <ul className="space-y-1">
                <li>&quot;What have I learned about React hooks?&quot;</li>
                <li>&quot;Summarize my notes on project management&quot;</li>
                <li>&quot;What resources do I have about TypeScript?&quot;</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs font-medium mb-2">
                        Sources ({message.sourcesUsed} searched, {message.citations.length} cited):
                      </p>
                      <ul className="space-y-1">
                        {message.citations.map((citation, index) => (
                          <li
                            key={citation.contentId}
                            className="text-xs flex items-start gap-1"
                          >
                            <span className="font-medium">[{index + 1}]</span>
                            <span>
                              {citation.title}
                              <span className="text-current/60 ml-1">
                                ({citation.relevance})
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}

            {/* Loading indicator */}
            {isPending && (
              <div className="flex items-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Searching your knowledge base...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your knowledge base..."
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !question.trim()}>
            {isPending ? 'Thinking...' : 'Ask'}
          </Button>
        </div>
      </form>
    </div>
  );
}
