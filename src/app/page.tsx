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

      <div className="relative z-10 flex flex-col items-center text-center pb-20">
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
            className="logo-adaptive h-[26px] w-auto object-contain opacity-30"
          />
          <Image
            src="/logos/withings.png"
            alt="Withings"
            width={120}
            height={16}
            className="logo-adaptive h-[11px] w-auto object-contain opacity-30"
          />
          <span className="text-[15px] font-bold tracking-tight text-t1 opacity-25">
            hevy
          </span>
          <span className="text-[11px] font-light tracking-wider text-tm italic">
            &amp; more
          </span>
        </div>

        <div className="animate-fade-in-up animate-delay-600 mt-14 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-btn px-8 py-3 text-[12px] font-light tracking-[0.2em] text-t1 uppercase transition-all hover:bg-btn-h"
            >
              Get Started
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://github.com/ilan-ibh/starkhealth"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-edge px-5 py-3 text-[12px] font-light tracking-wider text-t3 transition-all hover:border-edge-h hover:text-t1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </div>
          <Link href="/login" className="text-[11px] font-light tracking-wider text-tm transition-colors hover:text-t3">
            Already have an account? Sign In
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 z-10">
        <div className="flex items-center gap-6 text-[10px] tracking-wider text-tm">
          <span>&copy; {new Date().getFullYear()} Stark Health</span>
          <Link href="/privacy" className="transition-colors hover:text-t3">Privacy Policy</Link>
          <a href="https://github.com/ilan-ibh/starkhealth" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-t3">GitHub</a>
      </div>
      </footer>
    </main>
  );
}
