"use client";

import { useEffect, useState } from "react";

export function HealthScore({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const circ = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (animated / 100) * circ;
  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="128" height="128" className="-rotate-90">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="5"
          />
          {/* Progress */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-[1.5s] ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extralight text-white/90">
            {animated}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[9px] font-medium tracking-[0.25em] text-white/25 uppercase">
        Health Score
      </p>
    </div>
  );
}
