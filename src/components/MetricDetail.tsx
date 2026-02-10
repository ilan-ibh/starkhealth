"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DayData } from "@/lib/sample-data";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-edge-s bg-page px-3 py-2 shadow-xl">
      <p className="mb-1 text-[10px] text-t4">{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} className="text-xs font-light" style={{ color: e.color }}>
          {e.value}
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Props {
  label: string;
  dataKey: keyof Omit<DayData, "date">;
  unit: string;
  color: string;
  days: DayData[];
  onClose: () => void;
}

export function MetricDetail({ label, dataKey, unit, color, days, onClose }: Props) {
  const [range, setRange] = useState(7);

  const filtered = useMemo(() => {
    return days.slice(-range).map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: (d[dataKey] as number) ?? 0,
    }));
  }, [days, range, dataKey]);

  const values = filtered.map((d) => d.value).filter((v) => v !== 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;

  return (
    <div className="animate-fade-in-up col-span-full rounded-2xl border border-edge bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-light tracking-wider text-t1">{label}</h3>
          <p className="text-[11px] font-light text-t4">Trend over the last {range} days</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex rounded-lg border border-edge">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRange(r.days)}
                className={`px-3 py-1 text-[11px] font-light transition-all ${
                  range === r.days
                    ? "bg-btn-h text-t1"
                    : "text-t4 hover:text-t2"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-t4 transition-colors hover:bg-btn hover:text-t2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id="metricDetailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--chart-text)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={range <= 7 ? 0 : range <= 14 ? 1 : 4}
            />
            <YAxis
              tick={{ fill: "var(--chart-text)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={35}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip content={<Tip />} />
            <Area
              type="monotone"
              dataKey="value"
              name={`${label} (${unit})`}
              stroke={color}
              fill="url(#metricDetailGrad)"
              strokeWidth={2}
              dot={{ r: 3, fill: color, stroke: color }}
              activeDot={{ r: 5, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Min", value: min },
          { label: "Avg", value: avg },
          { label: "Max", value: max },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-page p-3 text-center">
            <p className="text-[9px] font-medium tracking-[0.2em] text-tm uppercase">{s.label}</p>
            <p className="mt-1 text-lg font-extralight text-t1">
              {s.value}
              <span className="ml-1 text-[11px] text-t4">{unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
