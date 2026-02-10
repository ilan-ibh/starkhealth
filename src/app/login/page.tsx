"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const supabase = createClient();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else { router.push("/dashboard"); router.refresh(); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { router.push("/dashboard"); router.refresh(); }
    }
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-page px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-glow blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="mb-12 flex justify-center">
          <Image src="/logo.png" alt="Stark Health" width={48} height={48} />
        </Link>

        <h1 className="text-center text-xl font-extralight tracking-[0.15em] text-t1 uppercase">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>
        <p className="mt-2 text-center text-[12px] font-light text-t4">
          {mode === "signin" ? "Welcome back to Stark Health" : "Start aggregating your health data"}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm font-light text-t1 placeholder-tm outline-none transition-colors focus:border-edge-h" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm font-light text-t1 placeholder-tm outline-none transition-colors focus:border-edge-h" placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} />
          </div>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] font-light text-red-500">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[12px] font-light text-emerald-600 dark:text-emerald-400">{success}</p>}
          <button type="submit" disabled={loading}
            className="mt-2 w-full rounded-xl bg-btn py-3 text-sm font-light tracking-wider text-t1 transition-all hover:bg-btn-h disabled:opacity-40">
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] font-light text-t4">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }}
            className="text-t2 underline underline-offset-4 transition-colors hover:text-t1">
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  );
}
