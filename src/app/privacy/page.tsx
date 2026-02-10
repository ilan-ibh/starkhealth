import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Stark Health",
  description: "Privacy Policy for Stark Health application.",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-page px-6 py-20">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-16 inline-flex items-center gap-2 text-xs tracking-[0.15em] text-t4 uppercase transition-colors hover:text-t2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>

        {/* Title */}
        <h1 className="mt-12 text-3xl font-extralight tracking-[0.15em] text-t1 uppercase">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm font-light text-t3">
          Last updated: February 2026
        </p>
        <div className="mt-4 h-px w-16 bg-edge" />

        {/* Content */}
        <div className="mt-16 space-y-14 text-sm leading-relaxed font-light text-t2">

          {/* Section 1 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">1. Introduction</h2>
            <p>
              This Privacy Policy explains how Stark Health (&ldquo;the App&rdquo;) collects, uses, stores, and protects personal data when you connect your health and fitness accounts to our platform.
            </p>
            <p className="mt-3">
              By authorizing access to any third-party service (WHOOP, Withings, Hevy, or others), you consent to the data practices described in this policy.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">2. Data We Access</h2>
            <p>
              With your explicit permission, the App may access the following data from your connected accounts, depending on the services you authorize:
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[13px] font-medium text-t1">WHOOP (via OAuth 2.0)</p>
                <ul className="mt-2 list-none space-y-1.5 pl-0">
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Recovery metrics (recovery score, HRV, resting heart rate, SpO2)</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Sleep data (duration, stages, performance, consistency)</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Strain and workout data (strain score, heart rate, calories)</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Basic profile information and body measurements</li>
                </ul>
              </div>

              <div>
                <p className="text-[13px] font-medium text-t1">Withings (via OAuth 2.0)</p>
                <ul className="mt-2 list-none space-y-1.5 pl-0">
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Weight and BMI measurements</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Body composition (body fat percentage, muscle mass)</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Daily activity and step count</li>
                </ul>
              </div>

              <div>
                <p className="text-[13px] font-medium text-t1">Hevy (via API Key)</p>
                <ul className="mt-2 list-none space-y-1.5 pl-0">
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Workout history (exercises, sets, reps, weight)</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Exercise templates and muscle group data</li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Personal records and routines</li>
                </ul>
              </div>
            </div>

            <p className="mt-4">We do not access any data beyond the scopes you authorize.</p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">3. How We Use Your Data</h2>
            <p>Your health data is used solely to:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Display and analyze your health and performance metrics on your dashboard</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Calculate your Stark Health Score by cross-referencing data from multiple sources</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Provide AI-powered insights and recommendations via the Stark Health assistant</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Cache data locally in your Supabase database for faster dashboard loading</li>
            </ul>
            <p className="mt-4">Your data is never sold or used for advertising purposes.</p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">4. AI Assistant &amp; API Keys</h2>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />The AI assistant is powered by Anthropic Claude. Each user provides their own Anthropic API key</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Your health data is sent to Anthropic only when you use the chat feature, as context for generating responses</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />API keys are stored encrypted in your Supabase database and are never shared with third parties</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Anthropic&rsquo;s use of data sent via their API is governed by their own privacy policy</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">5. Data Storage and Security</h2>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />OAuth access tokens, refresh tokens, and API keys are stored securely in Supabase with Row Level Security</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Each user can only access their own data — enforced at the database level</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Health data is cached for up to 4 hours to reduce API calls and improve performance</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Data is retained only for as long as necessary to provide the service</li>
            </ul>
            <p className="mt-4">If you revoke access or disconnect a provider, we immediately stop collecting new data from that provider.</p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">6. Data Sharing</h2>
            <p>We do not share your health data with third parties, except:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />When required by law</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />When you use the AI assistant, your data is sent to Anthropic to generate responses (using your own API key)</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />When necessary to operate the service (e.g., Supabase for database, Vercel for hosting), under strict confidentiality obligations</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">7. Your Rights</h2>
            <p>You may:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Disconnect any provider at any time from Settings</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Revoke WHOOP access from your WHOOP account settings</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Revoke Withings access from your Withings account settings</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" />Delete your Stark Health account and all associated data from Settings</li>
            </ul>
            <p className="mt-4">Account deletion permanently removes all stored data including tokens, cached health data, and profile information.</p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">8. Third-Party Services</h2>
            <p>This App integrates with:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" /><strong className="font-medium">WHOOP API</strong> — governed by WHOOP&rsquo;s terms and privacy policy</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" /><strong className="font-medium">Withings API</strong> — governed by Withings&rsquo; terms and privacy policy</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" /><strong className="font-medium">Hevy API</strong> — governed by Hevy&rsquo;s terms and privacy policy</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" /><strong className="font-medium">Anthropic API</strong> — governed by Anthropic&rsquo;s terms and privacy policy</li>
              <li className="flex items-start gap-3"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-t4" /><strong className="font-medium">Supabase</strong> — database and authentication provider</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">9. Open Source</h2>
            <p>
              Stark Health is open source. Users who self-host the application are responsible for their own data storage, security practices, and compliance with applicable regulations. The open-source codebase does not include any pre-configured credentials or user data.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">11. Contact</h2>
            <p>
              If you have any questions or requests regarding this Privacy Policy or your data, you can contact us at:
            </p>
            <p className="mt-4 text-t1">
              Email:{" "}
              <a href="mailto:contact@starkhealth.io" className="underline underline-offset-4 transition-colors hover:text-t1">
                contact@starkhealth.io
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-20 h-px w-full bg-edge" />
        <footer className="mt-8 flex items-center justify-between pb-12 text-[10px] tracking-wider text-tm">
          <span>&copy; {new Date().getFullYear()} Stark Health</span>
          <Link href="/" className="transition-colors hover:text-t3">Home</Link>
        </footer>
      </div>
    </main>
  );
}
