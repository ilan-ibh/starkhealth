"use client";

interface Props {
  label: string;
  value: number;
  unit: string;
  delta: number;
  positive: boolean;
  recency: string; // "today" | "yesterday" | "2d ago" | etc.
  sparkline: number[];
  color: string;
  delay?: number;
  onClick?: () => void;
  active?: boolean;
}

export function MetricCard({ label, value, unit, delta, positive, recency, sparkline, color, delay = 0, onClick, active }: Props) {
  const w = 80, h = 28;
  const min = Math.min(...sparkline), max = Math.max(...sparkline);
  const range = max - min || 1;
  const points = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const gradientId = `spark-${label.replace(/\s+/g, "-")}`;

  const isStale = recency !== "today" && recency !== "";

  return (
    <div
      onClick={onClick}
      className={`animate-fade-in-up group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:border-edge-s hover:bg-card-h ${active ? "border-edge-h ring-1 ring-edge-s" : "border-edge"} ${onClick ? "cursor-pointer" : ""}`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">{label}</p>
        {isStale && (
          <span className="rounded-full bg-btn px-1.5 py-0.5 text-[8px] font-light text-t4">{recency}</span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-extralight text-t1">{value}</span>
        {unit && <span className="text-sm font-light text-t4">{unit}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {delta !== 0 ? (
          <>
            <span className={`text-[11px] font-light ${positive ? "text-emerald-500" : "text-red-500"}`}>
              {delta > 0 ? "+" : ""}{delta}{unit}
            </span>
            <span className="text-[9px] text-tm">vs prev</span>
          </>
        ) : (
          <span className="text-[9px] text-tm">no change</span>
        )}
      </div>
      <div className="mt-3">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${gradientId})`} />
          <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        </svg>
      </div>
    </div>
  );
}
