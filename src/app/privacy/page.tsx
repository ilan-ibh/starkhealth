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
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        {/* Title */}
        <h1 className="mt-12 text-3xl font-extralight tracking-[0.15em] uppercase">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm font-light text-t3">
          Last updated: February 2026
        </p>

        <div className="mt-4 h-px w-16 bg-white/10" />

        {/* Content */}
        <div className="mt-16 space-y-14 text-sm leading-relaxed font-light text-t2">
          {/* Section 1 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy explains how we collect, use, store, and
              protect personal data when you connect your WHOOP account to our
              application (&ldquo;the App&rdquo;).
            </p>
            <p className="mt-3">
              By authorizing access to your WHOOP account, you consent to the
              data practices described in this policy.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              2. Data We Access
            </h2>
            <p>
              With your explicit permission via WHOOP&rsquo;s OAuth
              authorization flow, the App may access the following data from your
              WHOOP account, depending on the scopes you approve:
            </p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Sleep data
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Recovery metrics (e.g. HRV, resting heart rate, recovery score)
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Workout and strain data
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Basic profile information
              </li>
            </ul>
            <p className="mt-4">
              We do not access any data beyond the scopes you authorize.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              3. How We Use Your Data
            </h2>
            <p>Your WHOOP data is used solely to:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Display and analyze your health and performance metrics
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Provide insights, visualizations, or features within the App
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Improve the functionality and reliability of the App
              </li>
            </ul>
            <p className="mt-4">
              Your data is never sold or used for advertising purposes.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              4. Data Storage and Security
            </h2>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Access tokens and data are stored securely
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Reasonable technical and organizational measures are used to
                protect your data
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Data is retained only for as long as necessary to provide the
                service
              </li>
            </ul>
            <p className="mt-4">
              If you revoke access, we immediately stop collecting new data.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              5. Data Sharing
            </h2>
            <p>
              We do not share your WHOOP data with third parties, except:
            </p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                When required by law
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                When necessary to operate the service (e.g. secure
                infrastructure providers), under strict confidentiality
                obligations
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              6. Your Rights
            </h2>
            <p>You may:</p>
            <ul className="mt-4 list-none space-y-2 pl-0">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Revoke WHOOP access at any time from your WHOOP account settings
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-white/30" />
                Request deletion of any stored data related to your account
              </li>
            </ul>
            <p className="mt-4">
              Requests can be made by contacting us at the email address below.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              7. Third-Party Services
            </h2>
            <p>
              This App integrates with the WHOOP API. Use of WHOOP services is
              governed by WHOOP&rsquo;s own terms and privacy policy.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be reflected on this page with an updated &ldquo;Last
              updated&rdquo; date.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="mb-4 text-lg font-light tracking-wider text-t1">
              9. Contact
            </h2>
            <p>
              If you have any questions or requests regarding this Privacy Policy
              or your data, you can contact us at:
            </p>
            <p className="mt-4 text-t1">
              Email:{" "}
              <a
                href="mailto:contact@starkhealth.io"
                className="underline underline-offset-4 transition-colors hover:text-t1"
              >
                contact@starkhealth.io
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-20 h-px w-full bg-card-h" />
        <footer className="mt-8 flex items-center justify-between pb-12 text-[10px] tracking-wider text-tm">
          <span>&copy; {new Date().getFullYear()} Stark Health</span>
          <Link
            href="/"
            className="transition-colors hover:text-t3"
          >
            Home
          </Link>
        </footer>
      </div>
    </main>
  );
}
