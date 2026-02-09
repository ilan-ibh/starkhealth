"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Connection {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: React.ReactNode;
  color: string;
  scopes: string[];
}

const CONNECTIONS: Connection[] = [
  {
    id: "whoop",
    name: "WHOOP",
    description: "Recovery, HRV, sleep, strain & workout data",
    connected: false,
    color: "#22c55e",
    scopes: [
      "Recovery metrics",
      "Sleep data & stages",
      "Strain & workouts",
      "Heart rate & HRV",
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M7 12h2l1.5-3 3 6 1.5-3h2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "withings",
    name: "Withings",
    description: "Weight, body composition, blood pressure & activity",
    connected: false,
    color: "#3b82f6",
    scopes: [
      "Weight & BMI",
      "Body composition",
      "Blood pressure",
      "Daily activity & steps",
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },
];

export default function Settings() {
  const [connections, setConnections] = useState(CONNECTIONS);

  const toggle = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c))
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/logo.png" alt="Stark Health" width={28} height={28} />
            </Link>
            <div className="h-4 w-px bg-white/[0.06]" />
            <span className="text-[11px] font-light tracking-[0.2em] text-white/35 uppercase">
              Settings
            </span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[11px] font-light tracking-wider text-white/35 transition-colors hover:text-white/70"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3l-5 5 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Connected Services */}
        <section>
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase">
            Connected Services
          </h2>
          <p className="mt-2 text-sm font-light text-white/40">
            Connect your health devices to aggregate data into your Stark Health
            dashboard.
          </p>

          <div className="mt-8 space-y-4">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06]"
                      style={{ color: conn.color }}
                    >
                      {conn.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-light tracking-wider text-white/80">
                        {conn.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] font-light text-white/30">
                        {conn.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(conn.id)}
                    className={`shrink-0 rounded-full px-5 py-2 text-[11px] font-light tracking-wider transition-all ${
                      conn.connected
                        ? "border border-white/[0.06] text-white/40 hover:border-red-500/30 hover:text-red-400/70"
                        : "bg-white/[0.08] text-white/80 hover:bg-white/[0.12]"
                    }`}
                  >
                    {conn.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>

                {/* Status */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      conn.connected ? "bg-emerald-400" : "bg-white/15"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-light ${
                      conn.connected ? "text-emerald-400/70" : "text-white/25"
                    }`}
                  >
                    {conn.connected ? "Connected" : "Not connected"}
                  </span>
                </div>

                {/* Scopes */}
                <div className="mt-4 border-t border-white/[0.03] pt-4">
                  <p className="text-[9px] font-medium tracking-[0.2em] text-white/20 uppercase">
                    Data access
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {conn.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="rounded-full border border-white/[0.04] px-3 py-1 text-[10px] font-light text-white/30"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Account Section */}
        <section className="mt-14">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase">
            Account
          </h2>

          <div className="mt-6 space-y-3">
            {/* Profile */}
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-sm font-light text-white/40">
                  U
                </div>
                <div>
                  <p className="text-sm font-light text-white/70">User</p>
                  <p className="text-[11px] font-light text-white/25">
                    contact@starkhealth.io
                  </p>
                </div>
              </div>
              <button className="text-[11px] font-light tracking-wider text-white/30 transition-colors hover:text-white/60">
                Edit
              </button>
            </div>

            {/* Preferences */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-white/70">Units</p>
                  <p className="text-[11px] font-light text-white/25">
                    Metric (kg, km)
                  </p>
                </div>
                <button className="text-[11px] font-light tracking-wider text-white/30 transition-colors hover:text-white/60">
                  Change
                </button>
              </div>
            </div>

            {/* Data */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-white/70">
                    Data &amp; Privacy
                  </p>
                  <p className="text-[11px] font-light text-white/25">
                    Manage your data and export options
                  </p>
                </div>
                <Link
                  href="/privacy"
                  className="text-[11px] font-light tracking-wider text-white/30 transition-colors hover:text-white/60"
                >
                  View Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-14 pb-12">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-red-400/40 uppercase">
            Danger Zone
          </h2>
          <div className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-white/60">
                  Delete Account
                </p>
                <p className="text-[11px] font-light text-white/25">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className="rounded-full border border-red-500/20 px-4 py-1.5 text-[11px] font-light tracking-wider text-red-400/60 transition-all hover:border-red-500/40 hover:text-red-400">
                Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
