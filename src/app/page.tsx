import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-page px-6">
      {/* Theme toggle */}
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-glow blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="animate-fade-in-up mb-16">
          <Image src="/logo.png" alt="Stark Health" width={120} height={120} className="mx-auto" priority />
        </div>

        <h1 className="animate-fade-in-up animate-delay-200 text-[clamp(2rem,5vw,4rem)] font-extralight tracking-[0.3em] text-t1 uppercase">
          Stark Health
        </h1>

        <div className="animate-fade-in animate-delay-400 animate-pulse-line my-10 h-px w-24 bg-edge-h" />

        <p className="animate-fade-in-up animate-delay-400 max-w-md text-sm font-light tracking-[0.15em] text-t3 uppercase">
          Health intelligence, unified
        </p>

        {/* Integration logos */}
        <div className="animate-fade-in animate-delay-600 mt-14 flex items-center gap-8">
          <Image
            src="/logos/whoop.png"
            alt="WHOOP"
            width={120}
            height={34}
            className="logo-adaptive h-[18px] w-auto object-contain opacity-35"
          />
          <Image
            src="/logos/withings.png"
            alt="Withings"
            width={120}
            height={16}
            className="logo-adaptive h-[15px] w-auto object-contain opacity-35"
          />
          <span className="text-[16px] font-semibold tracking-tight text-t1 opacity-30">
            hevy
          </span>
          <span className="text-[12px] font-light tracking-wider text-tm italic">
            &amp; more
          </span>
        </div>

        <div className="animate-fade-in-up animate-delay-600 mt-14 flex flex-col items-center gap-5">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-btn px-8 py-3 text-[12px] font-light tracking-[0.2em] text-t1 uppercase transition-all hover:bg-btn-h"
          >
            Get Started
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/login" className="text-[11px] font-light tracking-wider text-tm transition-colors hover:text-t3">
            Already have an account? Sign In
          </Link>
        </div>

      </div>

      <footer className="absolute bottom-8 z-10">
        <div className="flex items-center gap-6 text-[10px] tracking-wider text-tm">
          <span>&copy; {new Date().getFullYear()} Stark Health</span>
          <Link href="/privacy" className="transition-colors hover:text-t3">Privacy Policy</Link>
      </div>
      </footer>
    </main>
  );
}
