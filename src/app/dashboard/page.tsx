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

// ── Utility functions ────────────────────────────────────────────────────

function r1(v: number) { return Math.round(v * 10) / 10; }
function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? null : n;
}

function getLatest(days: DayData[]) { return days[days.length - 1]; }

// Find most recent non-null value + its date
function findLatestMetric(days: DayData[], key: keyof Omit<DayData, "date">): { value: number; date: string } | null {
  for (let i = days.length - 1; i >= 0; i--) {
    const v = num(days[i][key]);
    if (v !== null) return { value: v, date: days[i].date };
  }
  return null;
}

// Compute delta between two most recent non-null values
function getDelta(days: DayData[], key: keyof Omit<DayData, "date">) {
  let found = 0;
  let current: number | null = null;
  let previous: number | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    const v = num(days[i][key]);
    if (v !== null) {
      if (found === 0) { current = v; found++; }
      else if (found === 1) { previous = v; found++; break; }
    }
  }
  if (current === null || previous === null) return { delta: 0, positive: true };
  const delta = r1(current - previous);
  const lowerBetter = ["rhr", "bodyFat", "weight", "awake"];
  return { delta, positive: lowerBetter.includes(key) ? delta <= 0 : delta >= 0 };
}

// Human-readable recency label
function recencyLabel(dateStr: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return `${Math.round(diffDays / 7)}w ago`;
}

function getSparkline(days: DayData[], key: keyof Omit<DayData, "date">, n = 7) {
  return days.slice(-n).map((d) => num(d[key]) ?? 0);
}

// ── Stark Health Score ───────────────────────────────────────────────────

function computeHealthScore(days: DayData[], trainingScore: number): { score: number; hasEnoughData: boolean } {
  if (days.length === 0) return { score: 0, hasEnoughData: false };

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Find most recent non-null value within 48h
  const findFresh = (key: keyof Omit<DayData, "date">): number | null => {
    for (let i = days.length - 1; i >= 0; i--) {
      const v = num(days[i][key]);
      if (v !== null) {
        const date = new Date(days[i].date);
        if (date >= cutoff48h) return v;
        return null; // too old
      }
    }
    return null;
  };

  const recovery = findFresh("recovery");
  const sleepScore = findFresh("sleepScore");
  const hrv = findFresh("hrv");
  const bodyFat = findFresh("bodyFat");

  const available = [recovery, sleepScore, hrv, bodyFat].filter((v) => v !== null).length;
  const hasEnoughData = available >= 2;

  if (!hasEnoughData) return { score: 0, hasEnoughData: false };

  // Only score fresh metrics — redistribute weights proportionally
  interface Factor { value: number; weight: number }
  const factors: Factor[] = [];

  if (recovery !== null) factors.push({ value: clamp(recovery, 0, 100), weight: 25 });
  if (sleepScore !== null) factors.push({ value: clamp(sleepScore, 0, 100), weight: 20 });
  if (hrv !== null) factors.push({ value: clamp(((hrv - 20) / 80) * 100, 0, 100), weight: 20 });
  if (bodyFat !== null) factors.push({ value: clamp(75 + (36 - bodyFat) * 2, 50, 100), weight: 15 });
  factors.push({ value: clamp(trainingScore, 0, 100), weight: 20 });

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = factors.reduce((s, f) => s + (f.value * (f.weight / totalWeight)), 0);

  return { score: Math.round(score), hasEnoughData: true };
}

// ── Hevy workout analytics ───────────────────────────────────────────────

interface RawWorkout {
  id: string; date: string; title: string; duration_min: number;
  exercises: { name: string; muscle_group: string; secondary_muscles?: string[]; sets: { weight_kg: number; reps: number; rpe: number | null; type: string }[] }[];
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
    const d = new Date(w.date); const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
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
    const d = new Date(w.date); const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

function computeStrength(workouts: RawWorkout[]) {
  const exerciseData: Record<string, { date: string; weight: number }[]> = {};
  const exerciseMaxWeight: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const top = ex.sets.filter((s) => s.type === "normal").reduce((b, s) => s.weight_kg > b ? s.weight_kg : b, 0);
      if (top > 0) {
        if (!exerciseData[ex.name]) exerciseData[ex.name] = [];
        exerciseData[ex.name].push({ date: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), weight: top });
        exerciseMaxWeight[ex.name] = Math.max(exerciseMaxWeight[ex.name] || 0, top);
      }
    }
  }
  return Object.entries(exerciseData)
    .sort((a, b) => (exerciseMaxWeight[b[0]] || 0) - (exerciseMaxWeight[a[0]] || 0))
    .slice(0, 4)
    .map(([exercise, data]) => ({ exercise, data }));
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
      const primary = MUSCLE_MAP[ex.muscle_group] || ex.muscle_group || "core";
      const primaryMapped = allMuscles.includes(primary as MuscleGroup) ? primary : "core";
      for (const s of ex.sets) {
        if (s.type !== "warmup") { loads[primaryMapped].sets++; loads[primaryMapped].volume += s.weight_kg * s.reps; }
      }
      if (!loads[primaryMapped].lastWorked || w.date > loads[primaryMapped].lastWorked) loads[primaryMapped].lastWorked = w.date;
      const secondaries = ex.secondary_muscles || [];
      for (const sec of secondaries) {
        const secMapped = MUSCLE_MAP[sec] || sec || "core";
        const secFinal = allMuscles.includes(secMapped as MuscleGroup) ? secMapped : "core";
        for (const s of ex.sets) {
          if (s.type !== "warmup") { loads[secFinal].sets += 0.5; loads[secFinal].volume += (s.weight_kg * s.reps) * 0.4; }
        }
        if (!loads[secFinal].lastWorked || w.date > loads[secFinal].lastWorked) loads[secFinal].lastWorked = w.date;
      }
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

// ── Insights (computed from real data) ───────────────────────────────────

interface Insight { text: string; type: "positive" | "warning" | "info" }

function computeInsights(days: DayData[], workouts: RawWorkout[]): Insight[] {
  if (days.length === 0 && workouts.length === 0) return [];
  const insights: Insight[] = [];
  const latest = days.length ? days[days.length - 1] : null;

  if (days.length >= 7) {
    const last7 = days.slice(-7);
    const prev7 = days.slice(-14, -7);
    if (prev7.length >= 3) {
      const avgHrvNow = last7.filter(d => num(d.hrv)).reduce((s, d) => s + (num(d.hrv) ?? 0), 0) / Math.max(1, last7.filter(d => num(d.hrv)).length);
      const avgHrvPrev = prev7.filter(d => num(d.hrv)).reduce((s, d) => s + (num(d.hrv) ?? 0), 0) / Math.max(1, prev7.filter(d => num(d.hrv)).length);
      if (avgHrvPrev > 0) {
        const change = Math.round(((avgHrvNow - avgHrvPrev) / avgHrvPrev) * 100);
        if (change > 5) insights.push({ text: `HRV improved ${change}% over the past 2 weeks (${Math.round(avgHrvPrev)}ms → ${Math.round(avgHrvNow)}ms) — cardiovascular fitness is trending up.`, type: "positive" });
        else if (change < -10) insights.push({ text: `HRV declined ${Math.abs(change)}% over the past 2 weeks (${Math.round(avgHrvPrev)}ms → ${Math.round(avgHrvNow)}ms) — consider prioritizing recovery.`, type: "warning" });
      }
    }
    const goodSleep = last7.filter(d => (num(d.sleepHours) ?? 0) >= 7.5);
    const badSleep = last7.filter(d => (num(d.sleepHours) ?? 0) < 6.5 && num(d.sleepHours) !== null);
    if (goodSleep.length > 0 && badSleep.length > 0) {
      const avgRecGood = goodSleep.reduce((s, d) => s + (num(d.recovery) ?? 0), 0) / goodSleep.length;
      const avgRecBad = badSleep.reduce((s, d) => s + (num(d.recovery) ?? 0), 0) / badSleep.length;
      if (avgRecGood > avgRecBad + 5) insights.push({ text: `Recovery averages ${Math.round(avgRecGood)}% after 7.5h+ sleep vs ${Math.round(avgRecBad)}% after <6.5h. Sleep is your biggest recovery lever.`, type: "info" });
    }
    if (latest && num(latest.recovery) !== null) {
      const recVals = last7.map(d => num(d.recovery)).filter((v): v is number => v !== null);
      const avgRec = recVals.length ? recVals.reduce((a, b) => a + b, 0) / recVals.length : 0;
      const todayRec = num(latest.recovery)!;
      if (todayRec > avgRec + 10) insights.push({ text: `Today's recovery (${todayRec}%) is well above your 7-day average (${Math.round(avgRec)}%) — good day for high intensity.`, type: "positive" });
      else if (todayRec < avgRec - 15) insights.push({ text: `Today's recovery (${todayRec}%) is below your 7-day average (${Math.round(avgRec)}%) — consider an active recovery day.`, type: "warning" });
    }
  }
  if (days.length >= 14) {
    const first = days[0];
    const last = days[days.length - 1];
    const bf0 = num(first.bodyFat), bf1 = num(last.bodyFat), mm0 = num(first.muscleMass), mm1 = num(last.muscleMass);
    if (bf0 !== null && bf1 !== null) {
      const bfChange = r1(bf1 - bf0);
      const mmChange = mm0 !== null && mm1 !== null ? r1(mm1 - mm0) : 0;
      if (bfChange < -0.5 && mmChange > 0) insights.push({ text: `Body fat ${bfChange}% and muscle mass +${mmChange}kg over ${days.length} days — recomposition is working.`, type: "positive" });
      else if (bfChange < -0.5) insights.push({ text: `Body fat decreased ${Math.abs(bfChange)}% over ${days.length} days. Keep it up.`, type: "positive" });
    }
  }
  if (workouts.length > 0) {
    const freq = computeFrequency(workouts);
    const avgFreq = freq.length ? Math.round((freq.reduce((s, w) => s + w.count, 0) / freq.length) * 10) / 10 : 0;
    if (avgFreq >= 4) insights.push({ text: `Training ${avgFreq}x per week consistently. Solid volume for progression.`, type: "positive" });
    else if (avgFreq > 0 && avgFreq < 3) insights.push({ text: `Averaging ${avgFreq} workouts per week. Consider adding 1-2 sessions for faster progress.`, type: "info" });
  }
  return insights.slice(0, 5);
}

const ONBOARDING_HINTS: Insight[] = [
  { text: "Connect WHOOP to see recovery, HRV, sleep, and strain insights.", type: "info" },
  { text: "Connect Withings to track weight, body fat, and body composition trends.", type: "info" },
  { text: "Connect Hevy to analyze your training volume, strength progression, and muscle fatigue.", type: "info" },
  { text: "Add your Anthropic API key to unlock the AI health coach.", type: "info" },
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
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/health-data").then((r) => r.json()).catch(() => null),
    ]).then(([settings, health]) => {
      setHasApiKey(settings.has_api_key ?? false);
      if (health) {
        setDays(health.days || []);
        setWorkouts(health.workouts || []);
        setProviders(health.providers || {});
        if (health.errors) setProviderErrors(health.errors);
      }
      setLoading(false);
    });
  }, []);

  const trainingScore = useMemo(() => computeTrainingScore(workouts), [workouts]);
  const { score, hasEnoughData } = useMemo(() => computeHealthScore(days, trainingScore), [days, trainingScore]);
  const hevySummary = useMemo(() => computeHevySummary(workouts), [workouts]);
  const muscleLoads = useMemo(() => computeMuscleLoads(workouts), [workouts]);

  const buildMetric = (label: string, key: keyof Omit<DayData, "date">, unit: string, color: string, sparkDays = 7) => {
    const found = findLatestMetric(days, key);
    return {
      label,
      dataKey: key,
      value: found?.value ?? 0,
      unit,
      recency: found ? recencyLabel(found.date) : "",
      ...getDelta(days, key),
      sparkline: getSparkline(days, key, sparkDays),
      color,
    };
  };

  const metrics = days.length > 0 ? [
    buildMetric("Recovery", "recovery", "%", "#22c55e"),
    buildMetric("HRV", "hrv", "ms", "#3b82f6"),
    buildMetric("Sleep", "sleepHours", "h", "#a855f7"),
    buildMetric("Strain", "strain", "", "#f97316"),
    buildMetric("Weight", "weight", "kg", "#06b6d4", 30),
    buildMetric("Body Fat", "bodyFat", "%", "#ec4899", 30),
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

      {/* Provider Error Banner */}
      {Object.keys(providerErrors).length > 0 && (
        <div className="border-b border-red-500/10 bg-red-500/[0.04] px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="text-[12px] font-light text-red-600 dark:text-red-400/80">
              {Object.entries(providerErrors).map(([p, msg]) => `${p.toUpperCase()}: ${msg}`).join(" · ")}
            </p>
            <Link href="/settings" className="shrink-0 rounded-full bg-red-500/10 px-4 py-1.5 text-[11px] font-light tracking-wider text-red-600 dark:text-red-400/80 transition-all hover:bg-red-500/20">Reconnect</Link>
          </div>
        </div>
      )}

      {/* API Key Banner */}
      {!loading && hasApiKey === false && (
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
          {hasEnoughData ? (
            <HealthScore score={score} />
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width="128" height="128" className="-rotate-90">
                  <circle cx="64" cy="64" r={54} fill="none" stroke="var(--edge)" strokeWidth="5" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extralight text-t4">—</span>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Stark Health Score</p>
                <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed font-light text-tm">Not enough data yet. Connect more providers to calculate your score.</p>
              </div>
            </div>
          )}
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
                <MetricCard key={m.label} {...m} delay={i * 80} active={selectedMetric === m.label}
                  onClick={() => setSelectedMetric(selectedMetric === m.label ? null : m.label)} />
              ))}
            </div>
            {selectedMetric && (() => {
              const m = metrics.find((x) => x.label === selectedMetric);
              if (!m) return null;
              return <MetricDetail label={m.label} dataKey={m.dataKey} unit={m.unit} color={m.color} days={days as DayData[]} onClose={() => setSelectedMetric(null)} />;
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
          {(() => {
            const realInsights = computeInsights(days as DayData[], workouts);
            const displayInsights = realInsights.length > 0 ? realInsights : ONBOARDING_HINTS;
            const hasData = realInsights.length > 0;
            return (
              <div className="rounded-2xl border border-edge bg-card p-5">
                <h3 className="mb-1 text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">{hasData ? "Cross-Source Insights" : "Get Started"}</h3>
                <p className="mb-3 text-[11px] font-light text-tm">{hasData ? "Generated from your WHOOP, Withings & Hevy data" : "Connect your providers to unlock insights"}</p>
                <div className="space-y-2.5">
                  {displayInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl border border-edge bg-page p-3">
                      <span className={`mt-0.5 text-[10px] ${ins.type === "positive" ? "text-emerald-500" : ins.type === "warning" ? "text-amber-500" : "text-blue-500"}`}>
                        {ins.type === "positive" ? "▲" : ins.type === "warning" ? "●" : "◆"}
                      </span>
                      <p className="text-[11px] leading-relaxed font-light text-t3">{ins.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
              <><p className="text-sm font-light text-t2">Hevy connected</p><p className="mt-1 text-[11px] text-tm">No workouts recorded yet — log your first workout in Hevy to see data here</p></>
            ) : (
              <><p className="text-sm font-light text-t3">Connect Hevy in Settings to see your workout data</p><Link href="/settings" className="mt-3 inline-block rounded-full bg-btn px-5 py-2 text-[11px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">Go to Settings</Link></>
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
