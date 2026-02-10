"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { PersonalRecord } from "@/lib/hevy-data";

/* eslint-disable @typescript-eslint/no-explicit-any */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-edge-s bg-page px-3 py-2 shadow-xl">
      <p className="mb-1 text-[10px] text-t4">{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} className="text-xs font-light" style={{ color: e.color }}>
          {e.name}: {typeof e.value === "number" ? e.value.toLocaleString() : e.value}
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const axisProps = { tick: { fill: "var(--chart-text)", fontSize: 10 }, axisLine: false, tickLine: false };

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <h3 className="mb-1 text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">{title}</h3>
      {subtitle && <p className="mb-3 text-[11px] font-light text-tm">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

// ── Weekly Volume Chart ──────────────────────────────────────────────────

export function VolumeChart({ data }: { data: { week: string; volume: number }[] }) {
  return (
    <Card title="Weekly Volume" subtitle="Total kg lifted per week">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="week" {...axisProps} />
            <YAxis {...axisProps} width={40} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="volume" name="Volume (kg)" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Workout Frequency Chart ──────────────────────────────────────────────

export function FrequencyChart({ data }: { data: { week: string; count: number }[] }) {
  return (
    <Card title="Training Frequency" subtitle="Workouts per week">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="25%">
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="week" {...axisProps} />
            <YAxis {...axisProps} width={20} domain={[0, 7]} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="count" name="Workouts" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Strength Progression Chart ───────────────────────────────────────────

const LIFT_COLORS: Record<string, string> = {
  "Bench Press": "#3b82f6",
  "Squat": "#22c55e",
  "Deadlift": "#ef4444",
  "Overhead Press": "#eab308",
};

export function StrengthChart({ data }: { data: { exercise: string; data: { date: string; weight: number }[] }[] }) {
  // Merge all dates into one dataset
  const allDates = new Set<string>();
  for (const lift of data) for (const d of lift.data) allDates.add(d.date);
  const sortedDates = Array.from(allDates);

  const merged = sortedDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const lift of data) {
      const point = lift.data.find((d) => d.date === date);
      if (point) row[lift.exercise] = point.weight;
    }
    return row;
  });

  return (
    <Card title="Strength Progression" subtitle="Top set weight over time">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="date" {...axisProps} interval={Math.max(0, Math.floor(merged.length / 6))} />
            <YAxis {...axisProps} width={35} unit="kg" />
            <Tooltip content={<Tip />} />
            {data.map((lift) => (
              <Line
                key={lift.exercise}
                type="monotone"
                dataKey={lift.exercise}
                name={lift.exercise}
                stroke={LIFT_COLORS[lift.exercise] || "#888"}
                strokeWidth={2}
                dot={{ r: 3, fill: LIFT_COLORS[lift.exercise] || "#888" }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {data.map((lift) => (
          <div key={lift.exercise} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: LIFT_COLORS[lift.exercise] }} />
            <span className="text-[10px] text-t4">{lift.exercise}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Personal Records ─────────────────────────────────────────────────────

export function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  return (
    <Card title="Personal Records" subtitle="Recent all-time bests">
      <div className="space-y-2.5">
        {records.map((pr) => {
          const improvement = pr.weight_kg - pr.previous_kg;
          return (
            <div key={pr.exercise} className="flex items-center gap-3 rounded-xl bg-page p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <span className="text-[13px]">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-light text-t1">{pr.exercise}</p>
                <p className="text-[10px] text-tm">
                  {pr.reps} reps @ {pr.weight_kg}kg
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-medium text-t1">{pr.weight_kg} kg</p>
                {improvement > 0 && (
                  <p className="text-[10px] text-emerald-500">+{improvement.toFixed(1)} kg</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
