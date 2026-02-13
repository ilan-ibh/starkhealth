"use client";

import { useState, useMemo } from "react";
import type { DayData } from "@/lib/sample-data";

type Period = "this_week" | "last_week" | "this_month" | "last_month";

const PERIODS: { id: Period; label: string }[] = [
  { id: "this_week", label: "This Week" },
  { id: "last_week", label: "Last Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
];

const METRICS: { key: keyof Omit<DayData, "date">; label: string; unit: string; lowerBetter?: boolean }[] = [
  { key: "recovery", label: "Recovery", unit: "%" },
  { key: "hrv", label: "HRV", unit: "ms" },
  { key: "sleepHours", label: "Sleep", unit: "h" },
  { key: "strain", label: "Strain", unit: "" },
  { key: "weight", label: "Weight", unit: "kg", lowerBetter: true },
  { key: "bodyFat", label: "Body Fat", unit: "%", lowerBetter: true },
];

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? null : n;
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();

  switch (period) {
    case "this_week": {
      const start = new Date(today); start.setDate(today.getDate() - dayOfWeek);
      return { start, end: today };
    }
    case "last_week": {
      const end = new Date(today); end.setDate(today.getDate() - dayOfWeek - 1);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      return { start, end };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }
    case "last_month": {
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { start, end };
    }
  }
}

function getPreviousPeriod(period: Period): Period {
  switch (period) {
    case "this_week": return "last_week";
    case "this_month": return "last_month";
    default: return period;
  }
}

function filterDays(days: DayData[], start: Date, end: Date) {
  return days.filter((d) => {
    const date = new Date(d.date);
    return date >= start && date <= end;
  });
}

function avg(days: DayData[], key: keyof Omit<DayData, "date">): number | null {
  const vals = days.map((d) => num(d[key])).filter((v): v is number => v !== null);
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
}

export function PeriodComparison({ days }: { days: DayData[] }) {
  const [period, setPeriod] = useState<Period>("this_week");

  const comparison = useMemo(() => {
    const currentRange = getDateRange(period);
    const prevPeriod = getPreviousPeriod(period);
    const prevRange = period === prevPeriod ? null : getDateRange(prevPeriod);

    const currentDays = filterDays(days, currentRange.start, currentRange.end);
    const prevDays = prevRange ? filterDays(days, prevRange.start, prevRange.end) : [];

    return METRICS.map((m) => {
      const currentAvg = avg(currentDays, m.key);
      const prevAvg = prevDays.length > 0 ? avg(prevDays, m.key) : null;
      const delta = currentAvg !== null && prevAvg !== null ? Math.round((currentAvg - prevAvg) * 10) / 10 : null;
      const positive = delta !== null ? (m.lowerBetter ? delta <= 0 : delta >= 0) : true;
      return { ...m, currentAvg, prevAvg, delta, positive };
    }).filter((m) => m.currentAvg !== null);
  }, [days, period]);

  if (days.length < 7) return null;

  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Period Comparison</h3>
        </div>
        <div className="flex rounded-lg border border-edge">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-2.5 py-1 text-[10px] font-light transition-all ${period === p.id ? "bg-btn-h text-t1" : "text-t4 hover:text-t2"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {comparison.map((m) => (
          <div key={m.key} className="rounded-xl bg-page p-3">
            <p className="text-[9px] font-medium tracking-[0.15em] text-tm uppercase">{m.label}</p>
            <p className="mt-1 text-lg font-extralight text-t1">
              {m.currentAvg}{m.unit && <span className="ml-0.5 text-[11px] text-t4">{m.unit}</span>}
            </p>
            {m.delta !== null && (
              <p className={`mt-0.5 text-[10px] font-light ${m.positive ? "text-emerald-500" : "text-red-500"}`}>
                {m.delta > 0 ? "+" : ""}{m.delta}{m.unit} vs prev
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
