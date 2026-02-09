import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="animate-fade-in-up mb-16">
          <Image
            src="/logo.png"
            alt="Stark Health"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        {/* Brand */}
        <h1 className="animate-fade-in-up animate-delay-200 text-[clamp(2rem,5vw,4rem)] font-extralight tracking-[0.3em] uppercase">
          Stark Health
        </h1>

        {/* Divider */}
        <div className="animate-fade-in animate-delay-400 animate-pulse-line my-10 h-px w-24 bg-white/30" />

        {/* Tagline */}
        <p className="animate-fade-in-up animate-delay-400 max-w-md text-sm font-light tracking-[0.15em] text-white/50 uppercase">
          Your health data, unified
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up animate-delay-600 mt-20 flex flex-col items-center gap-5">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-8 py-3 text-[12px] font-light tracking-[0.2em] text-white/80 uppercase transition-all hover:bg-white/[0.12]"
          >
            Get Started
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            className="text-[11px] font-light tracking-wider text-white/20 transition-colors hover:text-white/50"
          >
            Already have an account? Sign In
          </Link>
        </div>

        {/* Contact */}
        <p className="animate-fade-in animate-delay-800 mt-16 text-xs font-light tracking-wider text-white/20">
          contact@starkhealth.io
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 z-10 flex items-center gap-6 text-[10px] tracking-wider text-white/20">
        <span>&copy; {new Date().getFullYear()} Stark Health</span>
        <Link
          href="/privacy"
          className="transition-colors hover:text-white/50"
        >
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
