export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you use Mindweave, we collect the following information:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li><strong>Account information:</strong> Email address and name via Google OAuth sign-in.</li>
              <li><strong>Content you create:</strong> Notes, links, and files you save to your knowledge base.</li>
              <li><strong>Usage data:</strong> Basic session information for authentication purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>To provide and maintain the Mindweave service.</li>
              <li>To authenticate your identity via Google OAuth.</li>
              <li>To process your content with AI services for auto-tagging (Anthropic Claude API) and semantic search (Google Gemini text-embedding-004).</li>
              <li>To answer questions about your knowledge base using AI (Anthropic Claude API).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. AI Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your content is sent to the following third-party AI services for processing:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li><strong>Anthropic Claude API:</strong> Used for auto-tagging content and answering questions about your knowledge base.</li>
              <li><strong>Google Gemini API:</strong> Used to generate text embeddings for semantic search functionality.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These services process your content only as needed to provide the features described above. Please refer to{' '}
              <a href="https://www.anthropic.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Anthropic&apos;s Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a> for details on how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in a PostgreSQL database hosted on Google Cloud SQL. Files you upload are stored on the server. We use industry-standard security measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. Your content is only shared with the AI services listed above for the purpose of providing Mindweave&apos;s features. We do not share your data with any other third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cookies and Sessions</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use session cookies to keep you signed in. These are essential for the service to function and are not used for tracking or advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, modify, and delete your content at any time through the Mindweave interface. To request complete deletion of your account and all associated data, please contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindweave is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by updating the &quot;Last updated&quot; date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy, please contact us at{' '}
              <a href="mailto:das.abhijit34@gmail.com" className="text-primary hover:underline">das.abhijit34@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
