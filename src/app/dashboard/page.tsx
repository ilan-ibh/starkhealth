"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { sampleData, getLatest, getDelta, getSparkline, getHealthScore } from "@/lib/sample-data";
import { getHevySummary, getMuscleLoads, getWeeklyVolume, getWorkoutFrequency, getStrengthProgress, getPersonalRecords, getTrainingScore } from "@/lib/hevy-data";
import { MetricCard } from "@/components/MetricCard";
import { HealthScore } from "@/components/HealthScore";
import { RecoveryChart, BodyChart, SleepChart } from "@/components/Charts";
import { MuscleMap } from "@/components/MuscleMap";
import { VolumeChart, FrequencyChart, StrengthChart, PersonalRecords } from "@/components/WorkoutCharts";
import { ChatPanel } from "@/components/ChatPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

const INSIGHTS = [
  { text: "HRV improved 22% over the past 2 weeks — cardiovascular fitness is trending up.", type: "positive" as const },
  { text: "Recovery drops 18% on days following high-volume leg sessions. Consider lighter accessory work the day after.", type: "warning" as const },
  { text: "Body fat decreased 1.3% while muscle mass increased 0.7 kg — recomposition is working.", type: "positive" as const },
  { text: "Your bench press is up 6% this month. Sleep quality on training days correlates with next-day strength output.", type: "info" as const },
  { text: "Best recovery scores follow nights with 7.5+ hours of sleep AND rest days — prioritize both.", type: "info" as const },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const latest = getLatest();
  const trainingScore = getTrainingScore();
  const score = getHealthScore(trainingScore);
  const hevySummary = getHevySummary();
  const muscleLoads = getMuscleLoads();

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setHasApiKey(d.has_api_key ?? false)).catch(() => setHasApiKey(false));
  }, []);

  const metrics = [
    { label: "Recovery", value: latest.recovery, unit: "%", ...getDelta("recovery"), sparkline: getSparkline("recovery"), color: "#22c55e" },
    { label: "HRV", value: latest.hrv, unit: "ms", ...getDelta("hrv"), sparkline: getSparkline("hrv"), color: "#3b82f6" },
    { label: "Sleep", value: latest.sleepHours, unit: "h", ...getDelta("sleepHours"), sparkline: getSparkline("sleepHours"), color: "#a855f7" },
    { label: "Strain", value: latest.strain, unit: "", ...getDelta("strain"), sparkline: getSparkline("strain"), color: "#f97316" },
    { label: "Weight", value: latest.weight, unit: "kg", ...getDelta("weight"), sparkline: getSparkline("weight", 30), color: "#06b6d4" },
    { label: "Body Fat", value: latest.bodyFat, unit: "%", ...getDelta("bodyFat"), sparkline: getSparkline("bodyFat", 30), color: "#ec4899" },
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-edge bg-header backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link href="/"><Image src="/logo.png" alt="Stark Health" width={28} height={28} /></Link>
            <div className="h-4 w-px bg-edge" />
            <span className="text-[11px] font-light tracking-[0.2em] text-t4 uppercase">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/settings" className="flex items-center gap-2 rounded-full border border-edge px-3.5 py-2 text-[11px] font-light tracking-wider text-t4 transition-all hover:border-edge-h hover:text-t2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6.86 2h2.28l.36 1.77.9.37 1.61-.97 1.61 1.61-.97 1.61.37.9L15 8.86v2.28l-1.77.36-.37.9.97 1.61-1.61 1.61-1.61-.97-.9.37L8.86 15H6.86l-.36-1.77-.9-.37-1.61.97L2.38 12.22l.97-1.61-.37-.9L1 8.86V6.86l1.77-.36.37-.9-.97-1.61L3.78 2.38l1.61.97.9-.37L6.86 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* API Key Banner */}
      {hasApiKey === false && (
        <div className="border-b border-amber-500/10 bg-amber-500/[0.06] px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="text-[12px] font-light text-amber-700 dark:text-amber-300/70">Add your Anthropic API key in Settings to enable the AI assistant.</p>
            <Link href="/settings" className="shrink-0 rounded-full bg-amber-500/10 px-4 py-1.5 text-[11px] font-light tracking-wider text-amber-700 dark:text-amber-300/80 transition-all hover:bg-amber-500/20">Add Key</Link>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 pb-28">
        {/* Greeting + Score */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extralight tracking-wide text-t1">{greeting()}</h1>
            <p className="mt-1 text-sm font-light text-t4">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <HealthScore score={score} />
        </div>

        {/* ── WHOOP + Withings Metrics ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m, i) => (<MetricCard key={m.label} {...m} delay={i * 80} />))}
        </div>

        {/* ── Hevy Quick Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Workouts", value: hevySummary.totalWorkouts, sub: "this month" },
            { label: "Avg / Week", value: hevySummary.avgPerWeek, sub: "sessions" },
            { label: "Total Volume", value: `${(hevySummary.totalVolume / 1000).toFixed(0)}k`, sub: "kg lifted" },
            { label: "Avg Duration", value: `${hevySummary.avgDuration}`, sub: "min / session" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-edge bg-card p-4">
              <p className="text-[9px] font-medium tracking-[0.2em] text-t4 uppercase">{s.label}</p>
              <p className="mt-1 text-2xl font-extralight text-t1">{s.value}</p>
              <p className="text-[10px] text-tm">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Recovery & Body Charts ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecoveryChart data={sampleData} />
          <BodyChart data={sampleData} />
        </div>

        {/* ── Training Section ────────────────────────────────────────── */}
        <div className="mt-2">
          <h2 className="mb-4 text-[10px] font-medium tracking-[0.25em] text-t4 uppercase">Training — Hevy</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StrengthChart data={getStrengthProgress()} />
          <MuscleMap loads={muscleLoads} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VolumeChart data={getWeeklyVolume()} />
          <FrequencyChart data={getWorkoutFrequency()} />
        </div>

        {/* ── Sleep + PRs + Insights ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SleepChart data={sampleData} />
          <PersonalRecords records={getPersonalRecords()} />
          <div className="rounded-2xl border border-edge bg-card p-5">
            <h3 className="mb-1 text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Cross-Source Insights</h3>
            <p className="mb-3 text-[11px] font-light text-tm">WHOOP + Withings + Hevy combined</p>
            <div className="space-y-2.5">
              {INSIGHTS.map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-edge bg-page p-3">
                  <span className={`mt-0.5 text-[10px] ${ins.type === "positive" ? "text-emerald-500" : ins.type === "warning" ? "text-amber-500" : "text-blue-500"}`}>
                    {ins.type === "positive" ? "▲" : ins.type === "warning" ? "●" : "◆"}
                  </span>
                  <p className="text-[11px] leading-relaxed font-light text-t3">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="flex items-center justify-center gap-8 pb-8 pt-4">
          <span className="text-[9px] font-light tracking-[0.15em] text-tm uppercase">Data sources</span>
          <span className="text-[10px] font-medium tracking-[0.2em] text-t4">WHOOP</span>
          <span className="h-3 w-px bg-edge" />
          <span className="text-[10px] font-medium tracking-[0.2em] text-t4">WITHINGS</span>
          <span className="h-3 w-px bg-edge" />
          <span className="text-[10px] font-medium tracking-[0.2em] text-t4">HEVY</span>
        </div>
      </div>

      {/* Floating AI Button */}
      <button onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full border border-edge-s bg-page-s px-5 py-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-edge-h hover:shadow-lg ${chatOpen ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"}`}>
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 4h14v10H6l-3 3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" className="text-t2" />
            <circle cx="7.5" cy="9" r="0.8" fill="currentColor" className="text-t4" />
            <circle cx="10" cy="9" r="0.8" fill="currentColor" className="text-t4" />
            <circle cx="12.5" cy="9" r="0.8" fill="currentColor" className="text-t4" />
          </svg>
          {hasApiKey && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-page-s" />}
        </div>
        <span className="text-[12px] font-light tracking-wider text-t2">Ask Stark Health</span>
      </button>

      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} hasApiKey={hasApiKey ?? false} />
    </div>
  );
}
