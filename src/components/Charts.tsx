"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { DayData } from "@/lib/sample-data";

function fmt(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

/* eslint-disable @typescript-eslint/no-explicit-any */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-edge-s bg-page px-3 py-2 shadow-xl">
      <p className="mb-1 text-[10px] text-t4">{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} className="text-xs font-light" style={{ color: e.color }}>{e.name}: {e.value}</p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <h3 className="mb-4 text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">{title}</h3>
      <div className="h-[220px]">{children}</div>
    </div>
  );
}

const axisProps = { tick: { fill: "var(--chart-text)", fontSize: 10 }, axisLine: false, tickLine: false };

export function RecoveryChart({ data }: { data: DayData[] }) {
  const mapped = data.map((d) => ({ ...d, date: fmt(d.date) }));
  return (
    <Card title="Recovery & HRV — 30 Days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mapped}>
          <defs>
            <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
            <linearGradient id="gHrv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" {...axisProps} interval={6} />
          <YAxis {...axisProps} width={30} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="recovery" name="Recovery %" stroke="#22c55e" fill="url(#gRec)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#3b82f6" fill="url(#gHrv)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BodyChart({ data }: { data: DayData[] }) {
  const mapped = data.map((d) => ({ ...d, date: fmt(d.date) }));
  return (
    <Card title="Body Composition — 30 Days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mapped}>
          <defs>
            <linearGradient id="gWt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.12} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" {...axisProps} interval={6} />
          <YAxis yAxisId="w" {...axisProps} width={30} domain={["dataMin - 1", "dataMax + 1"]} />
          <YAxis yAxisId="bf" orientation="right" {...axisProps} width={30} domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip content={<Tip />} />
          <Area yAxisId="w" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" fill="url(#gWt)" strokeWidth={1.5} dot={false} />
          <Area yAxisId="bf" type="monotone" dataKey="bodyFat" name="Body Fat %" stroke="#ec4899" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SleepChart({ data }: { data: DayData[] }) {
  const last7 = data.slice(-7).map((d) => ({ ...d, date: fmt(d.date) }));
  return (
    <Card title="Sleep Breakdown — Last 7 Days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={last7} barCategoryGap="20%">
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis {...axisProps} width={30} />
          <Tooltip content={<Tip />} />
          <Bar dataKey="deepSleep" name="Deep" stackId="s" fill="#7c3aed" radius={[0, 0, 0, 0]} />
          <Bar dataKey="remSleep" name="REM" stackId="s" fill="#a855f7" radius={[0, 0, 0, 0]} />
          <Bar dataKey="lightSleep" name="Light" stackId="s" fill="#c084fc" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
