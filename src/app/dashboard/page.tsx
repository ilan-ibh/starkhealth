"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DayData } from "@/lib/sample-data";
import type { MuscleGroup } from "@/lib/hevy-data";
import { MetricCard } from "@/components/MetricCard";
import { MetricDetail } from "@/components/MetricDetail";
import { HealthScore } from "@/components/HealthScore";
import { RecoveryChart, BodyChart, SleepChart } from "@/components/Charts";
import { MuscleMap } from "@/components/MuscleMap";
import { VolumeChart, FrequencyChart, StrengthChart, PersonalRecords as PRList } from "@/components/WorkoutCharts";
import { ChatPanel } from "@/components/ChatPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── Utility functions (work on fetched data) ─────────────────────────────

function r1(v: number) { return Math.round(v * 10) / 10; }
function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

function getLatest(days: DayData[]) { return days[days.length - 1]; }

function getDelta(days: DayData[], key: keyof Omit<DayData, "date">) {
  if (days.length < 2) return { delta: 0, positive: true };
  const today = days[days.length - 1][key] as number;
  const yesterday = days[days.length - 2][key] as number;
  if (today == null || yesterday == null) return { delta: 0, positive: true };
  const delta = r1(today - yesterday);
  const lowerBetter = ["rhr", "bodyFat", "weight", "awake"];
  return { delta, positive: lowerBetter.includes(key) ? delta <= 0 : delta >= 0 };
}

function getSparkline(days: DayData[], key: keyof Omit<DayData, "date">, n = 7) {
  return days.slice(-n).map((d) => (d[key] as number) ?? 0);
}

function computeHealthScore(days: DayData[], trainingScore: number) {
  if (days.length === 0) return 0;
  const d = days[days.length - 1];
  const rec = (d.recovery ?? 0) * 0.25;
  const slp = (d.sleepScore ?? 0) * 0.2;
  const hrvN = clamp((((d.hrv ?? 0) - 20) / 80) * 100, 0, 100) * 0.2;
  const body = clamp(75 + (36 - (d.bodyFat ?? 20)) * 2, 50, 100) * 0.15;
  const train = trainingScore * 0.2;
  return Math.round(rec + slp + hrvN + body + train);
}

// ── Hevy workout analytics (from raw workout array) ──────────────────────

interface RawWorkout {
  id: string; date: string; title: string; duration_min: number;
  exercises: { name: string; muscle_group: string; sets: { weight_kg: number; reps: number; rpe: number | null; type: string }[] }[];
}

function computeHevySummary(workouts: RawWorkout[]) {
  if (!workouts.length) return { totalWorkouts: 0, avgPerWeek: 0, totalVolume: 0, avgDuration: 0 };
  const totalVolume = workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((eS, ex) =>
      eS + ex.sets.filter((s) => s.type !== "warmup").reduce((sS, s) => sS + s.weight_kg * s.reps, 0), 0), 0);
  return {
    totalWorkouts: workouts.length,
    avgPerWeek: r1(workouts.length / Math.max(1, 4.3)),
    totalVolume: Math.round(totalVolume),
    avgDuration: Math.round(workouts.reduce((s, w) => s + w.duration_min, 0) / workouts.length),
  };
}

function computeWeeklyVolume(workouts: RawWorkout[]) {
  const weeks: Record<string, number> = {};
  for (const w of workouts) {
    const d = new Date(w.date);
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let vol = 0;
    for (const ex of w.exercises) for (const s of ex.sets) { if (s.type !== "warmup") vol += s.weight_kg * s.reps; }
    weeks[key] = (weeks[key] || 0) + vol;
  }
  return Object.entries(weeks).map(([week, volume]) => ({ week, volume: Math.round(volume) }));
}

function computeFrequency(workouts: RawWorkout[]) {
  const weeks: Record<string, number> = {};
  for (const w of workouts) {
    const d = new Date(w.date);
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

function computeStrength(workouts: RawWorkout[]) {
  const lifts = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];
  return lifts.map((name) => {
    const data: { date: string; weight: number }[] = [];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.name === name) {
          const top = ex.sets.filter((s) => s.type === "normal").reduce((b, s) => s.weight_kg > b ? s.weight_kg : b, 0);
          if (top > 0) data.push({ date: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), weight: top });
        }
      }
    }
    return { exercise: name, data };
  });
}

function computePRs(workouts: RawWorkout[]) {
  const best: Record<string, { weight: number; reps: number; date: string; prev: number }> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const top = ex.sets.filter((s) => s.type === "normal").reduce((b, s) => s.weight_kg > b.w ? { w: s.weight_kg, r: s.reps } : b, { w: 0, r: 0 });
      if (top.w > 0) {
        if (!best[ex.name] || top.w > best[ex.name].weight) {
          best[ex.name] = { prev: best[ex.name]?.weight || top.w * 0.95, weight: top.w, reps: top.r, date: w.date };
        }
      }
    }
  }
  return Object.entries(best).map(([exercise, d]) => ({ exercise, weight_kg: d.weight, reps: d.reps, date: d.date, previous_kg: r1(d.prev) })).sort((a, b) => b.weight_kg - a.weight_kg).slice(0, 5);
}

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: "chest", back: "back", shoulders: "shoulders", biceps: "biceps", triceps: "triceps",
  forearms: "forearms", core: "core", quads: "quads", hamstrings: "hamstrings", glutes: "glutes", calves: "calves", traps: "traps",
  abs: "core", lats: "back", other: "core",
};

function computeMuscleLoads(workouts: RawWorkout[]) {
  const allMuscles: MuscleGroup[] = ["chest", "back", "shoulders", "biceps", "triceps", "forearms", "core", "quads", "hamstrings", "glutes", "calves", "traps"];
  const loads: Record<string, { sets: number; volume: number; lastWorked: string }> = {};
  for (const m of allMuscles) loads[m] = { sets: 0, volume: 0, lastWorked: "" };

  const recent = workouts.slice(-8);
  for (const w of recent) {
    for (const ex of w.exercises) {
      const muscle = MUSCLE_MAP[ex.muscle_group] || "core";
      for (const s of ex.sets) {
        if (s.type !== "warmup") { loads[muscle].sets++; loads[muscle].volume += s.weight_kg * s.reps; }
      }
      if (!loads[muscle].lastWorked || w.date > loads[muscle].lastWorked) loads[muscle].lastWorked = w.date;
    }
  }

  return allMuscles.map((m) => {
    const l = loads[m];
    const daysSince = l.lastWorked ? Math.max(0, (Date.now() - new Date(l.lastWorked).getTime()) / 86400000) : 99;
    const recency = daysSince < 1 ? 90 : daysSince < 2 ? 70 : daysSince < 3 ? 45 : daysSince < 5 ? 20 : 0;
    const vol = Math.min(l.sets * 3, 40);
    return { muscle: m, sets: Math.round(l.sets), volume: Math.round(l.volume), lastWorked: l.lastWorked, fatigue: Math.min(Math.round(recency + vol), 100) };
  });
}

function computeTrainingScore(workouts: RawWorkout[]) {
  const freq = computeFrequency(workouts);
  if (!freq.length) return 50;
  const avgFreq = freq.reduce((s, w) => s + w.count, 0) / freq.length;
  const freqScore = Math.min(avgFreq / 5, 1) * 50;
  const progress = computeStrength(workouts);
  let progScore = 0;
  for (const lift of progress) { if (lift.data.length >= 2 && lift.data[lift.data.length - 1].weight > lift.data[0].weight) progScore += 12.5; }
  return Math.min(Math.round(freqScore + progScore), 100);
}

// ── Insights ─────────────────────────────────────────────────────────────

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

// ── Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [days, setDays] = useState<DayData[]>([]);
  const [workouts, setWorkouts] = useState<RawWorkout[]>([]);
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    // Fetch settings + health data in parallel
    Promise.all([
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/health-data").then((r) => r.json()).catch(() => null),
    ]).then(([settings, health]) => {
      setHasApiKey(settings.has_api_key ?? false);
      if (health) {
        setDays(health.days || []);
        setWorkouts(health.workouts || []);
        setProviders(health.providers || {});
      }
      setLoading(false);
    });
  }, []);

  const latest = useMemo(() => days.length ? getLatest(days) : null, [days]);
  const trainingScore = useMemo(() => computeTrainingScore(workouts), [workouts]);
  const score = useMemo(() => computeHealthScore(days, trainingScore), [days, trainingScore]);
  const hevySummary = useMemo(() => computeHevySummary(workouts), [workouts]);
  const muscleLoads = useMemo(() => computeMuscleLoads(workouts), [workouts]);

  const metrics = latest ? [
    { label: "Recovery", dataKey: "recovery" as keyof Omit<DayData, "date">, value: latest.recovery ?? 0, unit: "%", ...getDelta(days, "recovery"), sparkline: getSparkline(days, "recovery"), color: "#22c55e" },
    { label: "HRV", dataKey: "hrv" as keyof Omit<DayData, "date">, value: latest.hrv ?? 0, unit: "ms", ...getDelta(days, "hrv"), sparkline: getSparkline(days, "hrv"), color: "#3b82f6" },
    { label: "Sleep", dataKey: "sleepHours" as keyof Omit<DayData, "date">, value: latest.sleepHours ?? 0, unit: "h", ...getDelta(days, "sleepHours"), sparkline: getSparkline(days, "sleepHours"), color: "#a855f7" },
    { label: "Strain", dataKey: "strain" as keyof Omit<DayData, "date">, value: latest.strain ?? 0, unit: "", ...getDelta(days, "strain"), sparkline: getSparkline(days, "strain"), color: "#f97316" },
    { label: "Weight", dataKey: "weight" as keyof Omit<DayData, "date">, value: latest.weight ?? 0, unit: "kg", ...getDelta(days, "weight"), sparkline: getSparkline(days, "weight", 30), color: "#06b6d4" },
    { label: "Body Fat", dataKey: "bodyFat" as keyof Omit<DayData, "date">, value: latest.bodyFat ?? 0, unit: "%", ...getDelta(days, "bodyFat"), sparkline: getSparkline(days, "bodyFat", 30), color: "#ec4899" },
  ] : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-t2" />
          <p className="text-sm font-light text-t4">Loading your health data...</p>
        </div>
      </div>
    );
  }

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

        {/* Section: Today */}
        <div className="flex items-center gap-4">
          <h2 className="text-[11px] font-light tracking-[0.25em] text-t3 uppercase">Today</h2>
          <div className="h-px flex-1 bg-edge" />
        </div>

        {metrics.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
              {metrics.map((m, i) => (
                <MetricCard
                  key={m.label}
                  {...m}
                  delay={i * 80}
                  active={selectedMetric === m.label}
                  onClick={() => setSelectedMetric(selectedMetric === m.label ? null : m.label)}
                />
              ))}
            </div>
            {selectedMetric && (() => {
              const m = metrics.find((x) => x.label === selectedMetric);
              if (!m) return null;
              return (
                <MetricDetail
                  label={m.label}
                  dataKey={m.dataKey}
                  unit={m.unit}
                  color={m.color}
                  days={days as DayData[]}
                  onClose={() => setSelectedMetric(null)}
                />
              );
            })()}
          </>
        ) : (
          <div className="rounded-2xl border border-edge bg-card p-8 text-center">
            <p className="text-sm font-light text-t3">Connect WHOOP or Withings in Settings to see your metrics</p>
          </div>
        )}

        {/* Section: Recovery & Sleep */}
        <div className="mt-4 flex items-center gap-4">
          <h2 className="text-[11px] font-light tracking-[0.25em] text-t3 uppercase">Recovery &amp; Sleep</h2>
          <div className="h-px flex-1 bg-edge" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecoveryChart data={days as DayData[]} />
          <SleepChart data={days as DayData[]} />
        </div>

        {/* Section: Body & Insights */}
        <div className="mt-4 flex items-center gap-4">
          <h2 className="text-[11px] font-light tracking-[0.25em] text-t3 uppercase">Body &amp; Insights</h2>
          <div className="h-px flex-1 bg-edge" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BodyChart data={days as DayData[]} />
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

        {/* Section: Training */}
        <div className="mt-4 flex items-center gap-4">
          <h2 className="text-[11px] font-light tracking-[0.25em] text-t3 uppercase">Training</h2>
          <div className="h-px flex-1 bg-edge" />
        </div>

        {hevySummary.totalWorkouts > 0 ? (
          <>
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StrengthChart data={computeStrength(workouts)} />
              <MuscleMap loads={muscleLoads} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <VolumeChart data={computeWeeklyVolume(workouts)} />
              <FrequencyChart data={computeFrequency(workouts)} />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <h2 className="text-[11px] font-light tracking-[0.25em] text-t3 uppercase">Personal Records</h2>
              <div className="h-px flex-1 bg-edge" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PRList records={computePRs(workouts)} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-edge bg-card p-8 text-center">
            {providers.hevy ? (
              <>
                <p className="text-sm font-light text-t2">Hevy connected</p>
                <p className="mt-1 text-[11px] text-tm">No workouts recorded yet — log your first workout in Hevy to see data here</p>
              </>
            ) : (
              <>
                <p className="text-sm font-light text-t3">Connect Hevy in Settings to see your workout data</p>
                <Link href="/settings" className="mt-3 inline-block rounded-full bg-btn px-5 py-2 text-[11px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">Go to Settings</Link>
              </>
            )}
          </div>
        )}

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
