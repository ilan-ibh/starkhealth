"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  sampleData,
  getLatest,
  getDelta,
  getSparkline,
  getHealthScore,
} from "@/lib/sample-data";
import { MetricCard } from "@/components/MetricCard";
import { HealthScore } from "@/components/HealthScore";
import { RecoveryChart, BodyChart, SleepChart } from "@/components/Charts";
import { ChatPanel } from "@/components/ChatPanel";

const INSIGHTS = [
  {
    text: "HRV improved 22% over the past 2 weeks — cardiovascular fitness is trending up.",
    type: "positive" as const,
  },
  {
    text: "Recovery scores are 18% higher after nights with 7.5+ hours of sleep.",
    type: "info" as const,
  },
  {
    text: "Body fat decreased 1.3% this month while muscle mass increased 0.7 kg.",
    type: "positive" as const,
  },
  {
    text: "Consider reducing strain on days following poor sleep — recovery drops significantly.",
    type: "warning" as const,
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const latest = getLatest();
  const score = getHealthScore();

  const metrics = [
    {
      label: "Recovery",
      value: latest.recovery,
      unit: "%",
      ...getDelta("recovery"),
      sparkline: getSparkline("recovery"),
      color: "#22c55e",
    },
    {
      label: "HRV",
      value: latest.hrv,
      unit: "ms",
      ...getDelta("hrv"),
      sparkline: getSparkline("hrv"),
      color: "#3b82f6",
    },
    {
      label: "Sleep",
      value: latest.sleepHours,
      unit: "h",
      ...getDelta("sleepHours"),
      sparkline: getSparkline("sleepHours"),
      color: "#a855f7",
    },
    {
      label: "Strain",
      value: latest.strain,
      unit: "",
      ...getDelta("strain"),
      sparkline: getSparkline("strain"),
      color: "#f97316",
    },
    {
      label: "Weight",
      value: latest.weight,
      unit: "kg",
      ...getDelta("weight"),
      sparkline: getSparkline("weight", 30),
      color: "#06b6d4",
    },
    {
      label: "Body Fat",
      value: latest.bodyFat,
      unit: "%",
      ...getDelta("bodyFat"),
      sparkline: getSparkline("bodyFat", 30),
      color: "#ec4899",
    },
  ];

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
              Dashboard
            </span>
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-full border border-white/[0.06] px-3.5 py-2 text-[11px] font-light tracking-wider text-white/35 transition-all hover:border-white/15 hover:text-white/70"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M6.86 2h2.28l.36 1.77.9.37 1.61-.97 1.61 1.61-.97 1.61.37.9L15 8.86v2.28l-1.77.36-.37.9.97 1.61-1.61 1.61-1.61-.97-.9.37L8.86 15H6.86l-.36-1.77-.9-.37-1.61.97L2.38 12.22l.97-1.61-.37-.9L1 8.86V6.86l1.77-.36.37-.9-.97-1.61L3.78 2.38l1.61.97.9-.37L6.86 2z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            Settings
          </Link>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 pb-28">
        {/* Greeting + Health Score */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extralight tracking-wide text-white/90">
              {greeting()}
            </h1>
            <p className="mt-1 text-sm font-light text-white/25">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <HealthScore score={score} />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} delay={i * 80} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecoveryChart data={sampleData} />
          <BodyChart data={sampleData} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SleepChart data={sampleData} />

          {/* Insights */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
            <h3 className="mb-4 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
              AI Insights
            </h3>
            <div className="space-y-3">
              {INSIGHTS.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.03] bg-white/[0.01] p-3.5"
                >
                  <span
                    className={`mt-0.5 text-[10px] ${
                      ins.type === "positive"
                        ? "text-emerald-400/70"
                        : ins.type === "warning"
                          ? "text-amber-400/70"
                          : "text-blue-400/70"
                    }`}
                  >
                    {ins.type === "positive"
                      ? "▲"
                      : ins.type === "warning"
                        ? "●"
                        : "◆"}
                  </span>
                  <p className="text-[12px] leading-relaxed font-light text-white/45">
                    {ins.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="flex items-center justify-center gap-8 pb-8 pt-4">
          <span className="text-[9px] font-light tracking-[0.15em] text-white/15 uppercase">
            Data sources
          </span>
          <span className="text-[10px] font-medium tracking-[0.2em] text-white/20">
            WHOOP
          </span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="text-[10px] font-medium tracking-[0.2em] text-white/20">
            WITHINGS
          </span>
        </div>
      </div>

      {/* ── Floating AI Chat Button ───────────────────────────────────── */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full border border-white/[0.08] bg-[#0a0a0a]/90 px-5 py-3.5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-white/[0.03] ${chatOpen ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"}`}
      >
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 4h14v10H6l-3 3V4z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="7.5" cy="9" r="0.8" fill="white" opacity="0.5" />
            <circle cx="10" cy="9" r="0.8" fill="white" opacity="0.5" />
            <circle cx="12.5" cy="9" r="0.8" fill="white" opacity="0.5" />
          </svg>
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0a]" />
        </div>
        <span className="text-[12px] font-light tracking-wider text-white/70">
          Ask Stark Health
        </span>
      </button>

      {/* ── Chat Panel ────────────────────────────────────────────────── */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
