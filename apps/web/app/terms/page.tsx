import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Mindweave',
  description: 'Terms of Service for using Mindweave, the AI-powered personal knowledge hub.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Mindweave, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindweave is an AI-powered personal knowledge hub that helps you capture, organize, and rediscover your ideas, notes, bookmarks, and learnings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate information when creating your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Use the service for any illegal purpose or in violation of any laws.</li>
              <li>Upload malicious content, malware, or harmful files.</li>
              <li>Attempt to gain unauthorized access to the service or its systems.</li>
              <li>Interfere with or disrupt the service or its infrastructure.</li>
              <li>Use the service to harass, abuse, or harm others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Your Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of all content you create, upload, or store in Mindweave. By using the service, you grant us a limited license to process your content as necessary to provide the service, including sending it to AI APIs for tagging, embedding, and question-answering features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. AI-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindweave uses AI to generate tags, search results, and answers to your questions. AI-generated content is provided as-is and may not always be accurate or complete. You should verify any important information independently. We are not responsible for decisions made based on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to keep Mindweave available at all times, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindweave is provided &quot;as is&quot; without warranties of any kind, either express or implied. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, use, or profits, arising out of or related to your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, contact us at{' '}
              <a href="mailto:mindweaveapp27@gmail.com" className="text-primary hover:underline">mindweaveapp27@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
