import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Mindweave.',
};

const faqs = [
  {
    question: 'What is Mindweave?',
    answer:
      'Mindweave is an AI-powered personal knowledge hub that helps you capture, organize, and rediscover your ideas, notes, bookmarks, and learnings. It combines traditional organization tools with AI capabilities like auto-tagging, semantic search, and knowledge Q&A.',
  },
  {
    question: 'Is Mindweave free to use?',
    answer:
      'Mindweave is currently available as a free service. Future pricing plans may be introduced as additional features are added.',
  },
  {
    question: 'What AI features does Mindweave use?',
    answer:
      'Mindweave uses Google Gemini AI for three main features: auto-tagging (analyzing content and suggesting tags), semantic search (understanding meaning rather than just keywords), and Knowledge Q&A (answering questions from your knowledge base using RAG).',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Your content is stored in a secure PostgreSQL database and is only accessible to you. Content is sent to Google Gemini for AI processing (tagging, embeddings, Q&A), but is not used for model training. See the Privacy Policy for full details.',
  },
  {
    question: 'What types of content can I save?',
    answer:
      'You can save three types of content: notes (free-form text), links (bookmarks with URLs), and files (uploaded documents and images).',
  },
  {
    question: 'How does semantic search differ from keyword search?',
    answer:
      'Keyword search matches exact words in your content. Semantic search uses AI to understand the meaning of your query and finds conceptually related content, even when the exact words don\'t match. For example, searching "machine learning" might return notes about "neural networks".',
  },
  {
    question: 'What is auto-tagging?',
    answer:
      'Auto-tagging uses Google Gemini AI to analyze your content and automatically suggest relevant tags. These AI-generated tags appear alongside your manual tags and are searchable and filterable just like manual tags.',
  },
  {
    question: 'How does Knowledge Q&A work?',
    answer:
      'Knowledge Q&A uses retrieval-augmented generation (RAG). When you ask a question, Mindweave finds the most relevant content in your knowledge base using vector search, then uses Google Gemini to generate a natural language answer based on that content. Answers include citations so you can verify the sources.',
  },
  {
    question: 'Can I use Mindweave without Google sign-in?',
    answer:
      'Yes. You can register with an email address and password instead of Google OAuth. Email verification is required to activate your account.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'To delete your account and all associated data, contact support at mindweaveapp27@gmail.com. Account deletion is permanent.',
  },
  {
    question: 'What browsers are supported?',
    answer:
      'Mindweave works in all modern browsers including Chrome, Firefox, Safari, and Edge. It is also available as a progressive web app (PWA) that you can install on your device.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'The analytics dashboard supports CSV export. Additional data export options for your full knowledge base are planned for a future release.',
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Answers to common questions about Mindweave. Can&apos;t find what you&apos;re looking for?
          Reach out to{' '}
          <a href="mailto:mindweaveapp27@gmail.com" className="text-primary hover:underline">support</a>.
        </p>
      </section>

      <section className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question} className="border-b pb-6 last:border-b-0">
            <h2 className="text-lg font-semibold mb-2">{faq.question}</h2>
            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
        <p className="text-muted-foreground mb-3">
          Check out the detailed documentation for each feature, or reach out to support.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started"
            className="text-sm text-primary hover:underline font-medium"
          >
            Getting Started &rarr;
          </Link>
          <Link
            href="/docs/features"
            className="text-sm text-primary hover:underline font-medium"
          >
            All Features &rarr;
          </Link>
          <Link
            href="/support"
            className="text-sm text-primary hover:underline font-medium"
          >
            Contact Support &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
