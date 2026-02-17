import type { Metadata } from 'next';
import { Mail, MessageCircleQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support - Mindweave',
  description: 'Get help with Mindweave. Find answers to frequently asked questions or contact our support team.',
};

const faqs = [
  {
    question: 'How do I create an account?',
    answer: 'Click "Sign In" and use your Google account to sign in. Your account is created automatically on first sign-in.',
  },
  {
    question: 'What types of content can I save?',
    answer: 'You can save notes (free-form text), links (URLs with automatic metadata), and files (documents, images, etc.).',
  },
  {
    question: 'How does AI tagging work?',
    answer: 'When you save content, Gemini AI automatically analyzes it and suggests relevant tags. You can also add your own tags manually.',
  },
  {
    question: 'What is semantic search?',
    answer: 'Semantic search finds content based on meaning rather than exact keywords. For example, searching for "cooking recipes" would also find notes about "meal preparation" or "food ideas".',
  },
  {
    question: 'How do I delete my account and data?',
    answer: 'Contact us at mindweaveapp27@gmail.com to request complete deletion of your account and all associated data.',
  },
  {
    question: 'Is my data shared with anyone?',
    answer: 'Your content is only sent to Google Gemini AI to provide tagging, search, and Q&A features. We never sell your data.',
  },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">Support</h1>
        <p className="text-muted-foreground mb-12">
          Need help with Mindweave? Find answers below or reach out to us directly.
        </p>

        {/* Contact */}
        <section className="mb-16">
          <div className="rounded-xl border bg-card p-6 flex items-start gap-4">
            <div className="inline-flex rounded-lg bg-primary/10 p-2.5">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Contact Us</h2>
              <p className="text-muted-foreground text-sm mb-2">
                For questions, bug reports, or feature requests, email us at:
              </p>
              <a
                href="mailto:mindweaveapp27@gmail.com"
                className="text-primary font-medium hover:underline"
              >
                mindweaveapp27@gmail.com
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex rounded-lg bg-purple-500/10 p-2.5">
              <MessageCircleQuestion className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
