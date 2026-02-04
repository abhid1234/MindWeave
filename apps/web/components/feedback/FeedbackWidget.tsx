'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Bug, Lightbulb, Sparkles, HelpCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitFeedbackAction, type SubmitFeedbackInput } from '@/app/actions/feedback';
import { useToast } from '@/components/ui/toast';

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'improvement', label: 'Improvement', icon: Sparkles, color: 'text-blue-500' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-500' },
] as const;

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [selectedType, setSelectedType] = useState<SubmitFeedbackInput['type']>('improvement');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleTypeSelect = (type: SubmitFeedbackInput['type']) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.length < 10) {
      addToast({
        title: 'Message too short',
        description: 'Please provide at least 10 characters.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFeedbackAction(
        {
          type: selectedType,
          message: message.trim(),
          email: email.trim() || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        },
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      );

      if (result.success) {
        addToast({
          title: 'Thank you!',
          description: 'Your feedback has been submitted successfully.',
          variant: 'success',
        });
        handleClose();
      } else {
        addToast({
          title: 'Error',
          description: result.error || 'Failed to submit feedback.',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('type');
    setMessage('');
    setEmail('');
  };

  const selectedTypeInfo = feedbackTypes.find((t) => t.value === selectedType);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 lg:bottom-8 lg:right-8"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="relative z-50 w-full max-w-md rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {step === 'type' ? 'Send Feedback' : selectedTypeInfo?.label}
              </h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {step === 'type' ? (
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleTypeSelect(type.value)}
                      className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted"
                    >
                      <Icon className={`h-6 w-6 ${type.color}`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="feedback-message" className="mb-1.5 block text-sm font-medium">
                    Your feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      selectedType === 'bug'
                        ? 'Describe the bug and steps to reproduce...'
                        : selectedType === 'feature'
                          ? 'Describe the feature you would like...'
                          : 'Share your thoughts...'
                    }
                    rows={4}
                    className="w-full resize-none rounded-lg border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                    minLength={10}
                    maxLength={2000}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.length}/2000 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="feedback-email" className="mb-1.5 block text-sm font-medium">
                    Email <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    We&apos;ll only use this to follow up if needed
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('type')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
