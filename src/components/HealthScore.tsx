"use client";

import { useEffect, useState } from "react";

export function HealthScore({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circ = 2 * Math.PI * radius;

  useEffect(() => { const t = setTimeout(() => setAnimated(score), 100); return () => clearTimeout(t); }, [score]);

  const offset = circ - (animated / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="128" height="128" className="-rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--edge)" strokeWidth="5" />
          <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-[1.5s] ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extralight text-t1">{animated}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <p className="text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">Stark Health Score</p>
        <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed font-light text-tm">Custom score based on your unified WHOOP &amp; Withings data</p>
      </div>
    </div>
  );
}
