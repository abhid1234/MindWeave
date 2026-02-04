import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Q&A',
  description: 'Ask natural language questions and get answers from your Mindweave knowledge base.',
};

export default function AskPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-3">Knowledge Q&amp;A</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The Knowledge Q&amp;A feature lets you ask natural language questions and receive
          answers drawn directly from your saved content. Powered by retrieval-augmented
          generation (RAG) with Google Gemini.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <p className="text-muted-foreground leading-relaxed">
          When you ask a question, Mindweave follows a multi-step process to find the best answer:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Query embedding</strong> — Your question is converted into a vector embedding
            using Google Gemini&apos;s text-embedding-004 model.
          </li>
          <li>
            <strong>Retrieval</strong> — The most relevant content from your knowledge base is
            found using vector similarity search (pgvector).
          </li>
          <li>
            <strong>Context building</strong> — The top matching content items are assembled as
            context for the AI.
          </li>
          <li>
            <strong>Generation</strong> — Google Gemini generates a natural language answer using
            only your retrieved content as its source material.
          </li>
          <li>
            <strong>Citation</strong> — The answer includes references to the source content so
            you can verify and explore further.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using Knowledge Q&amp;A</h2>
        <p className="text-muted-foreground leading-relaxed">
          Access the Q&amp;A feature from the <strong>Ask</strong> page in your dashboard.
          Type your question in natural language, just as you would ask a colleague.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Example questions:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>&quot;What notes do I have about React performance optimization?&quot;</li>
          <li>&quot;Summarize my bookmarks related to machine learning.&quot;</li>
          <li>&quot;What were the key takeaways from my project retrospective?&quot;</li>
          <li>&quot;Which links did I save about database indexing strategies?&quot;</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tips for Good Questions</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong>Be specific</strong> — &quot;What are my notes about PostgreSQL indexing?&quot;
            works better than &quot;database stuff&quot;.
          </li>
          <li>
            <strong>Ask about topics you have content on</strong> — The Q&amp;A can only answer
            based on what you&apos;ve saved. It won&apos;t make up information.
          </li>
          <li>
            <strong>Use follow-up questions</strong> — If the first answer is too broad, ask
            a more targeted follow-up.
          </li>
          <li>
            <strong>Check the sources</strong> — Review the cited content to verify the answer
            and discover related material.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Limitations</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Answers are only as good as the content in your knowledge base.</li>
          <li>Very recent content may not yet have embeddings generated.</li>
          <li>Questions about topics with no matching content will return a &quot;not enough context&quot; message.</li>
          <li>
            For simple lookups, consider using{' '}
            <Link href="/docs/features/search" className="text-primary hover:underline">search</Link>{' '}
            instead, which is faster for direct queries.
          </li>
        </ul>
      </section>
    </div>
  );
}
