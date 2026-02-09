"use client";

interface Props {
  label: string;
  value: number;
  unit: string;
  delta: number;
  positive: boolean;
  sparkline: number[];
  color: string;
  delay?: number;
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  positive,
  sparkline,
  color,
  delay = 0,
}: Props) {
  const w = 80;
  const h = 28;
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;

  const points = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className="animate-fade-in-up group relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <p className="text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
        {label}
      </p>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-extralight text-white/90">{value}</span>
        {unit && (
          <span className="text-sm font-light text-white/25">{unit}</span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className={`text-[11px] font-light ${
            positive ? "text-emerald-400/80" : "text-red-400/80"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta}
          {unit}
        </span>
        <span className="text-[9px] text-white/15">vs yesterday</span>
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id={`spark-${label}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Fill */}
          <polygon
            points={`0,${h} ${points} ${w},${h}`}
            fill={`url(#spark-${label})`}
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        </svg>
      </div>
    </div>
  );
}
