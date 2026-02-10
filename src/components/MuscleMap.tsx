"use client";

import type { MuscleLoad, MuscleGroup } from "@/lib/hevy-data";

function fatigueColor(fatigue: number): string {
  if (fatigue >= 75) return "#ef4444"; // red — high fatigue
  if (fatigue >= 50) return "#f97316"; // orange
  if (fatigue >= 30) return "#eab308"; // yellow
  if (fatigue >= 10) return "#22c55e"; // green — recovered
  return "var(--edge)"; // not worked recently
}

function fatigueOpacity(fatigue: number): number {
  if (fatigue >= 50) return 0.7;
  if (fatigue >= 20) return 0.5;
  if (fatigue >= 5) return 0.3;
  return 0.15;
}

function fatigueLabel(fatigue: number): string {
  if (fatigue >= 75) return "Fatigued";
  if (fatigue >= 50) return "Worked";
  if (fatigue >= 20) return "Recovering";
  if (fatigue >= 5) return "Recovered";
  return "Rested";
}

/* Simplified front body SVG paths mapped to muscle groups */
const MUSCLE_PATHS: Record<string, { d: string; muscles: MuscleGroup[] }[]> = {
  front: [
    // Chest
    { d: "M36,52 Q50,48 50,58 Q50,68 42,68 Q34,65 36,52Z", muscles: ["chest"] },
    { d: "M64,52 Q50,48 50,58 Q50,68 58,68 Q66,65 64,52Z", muscles: ["chest"] },
    // Shoulders
    { d: "M30,46 Q26,50 28,58 Q32,56 36,52 Q34,46 30,46Z", muscles: ["shoulders"] },
    { d: "M70,46 Q74,50 72,58 Q68,56 64,52 Q66,46 70,46Z", muscles: ["shoulders"] },
    // Biceps
    { d: "M26,60 Q24,70 26,78 Q30,78 30,70 Q28,62 26,60Z", muscles: ["biceps"] },
    { d: "M74,60 Q76,70 74,78 Q70,78 70,70 Q72,62 74,60Z", muscles: ["biceps"] },
    // Forearms
    { d: "M24,80 Q22,88 24,96 Q28,96 28,88 Q26,82 24,80Z", muscles: ["forearms"] },
    { d: "M76,80 Q78,88 76,96 Q72,96 72,88 Q74,82 76,80Z", muscles: ["forearms"] },
    // Core / Abs
    { d: "M42,70 Q50,68 58,70 Q58,88 50,90 Q42,88 42,70Z", muscles: ["core"] },
    // Quads
    { d: "M38,92 Q42,90 46,92 Q48,110 44,118 Q38,116 36,108 Q36,98 38,92Z", muscles: ["quads"] },
    { d: "M62,92 Q58,90 54,92 Q52,110 56,118 Q62,116 64,108 Q64,98 62,92Z", muscles: ["quads"] },
    // Calves (front view - tibialis)
    { d: "M40,120 Q44,118 46,120 Q46,134 44,140 Q40,138 40,130Z", muscles: ["calves"] },
    { d: "M60,120 Q56,118 54,120 Q54,134 56,140 Q60,138 60,130Z", muscles: ["calves"] },
  ],
  back: [
    // Traps
    { d: "M38,44 Q50,38 62,44 Q58,50 50,48 Q42,50 38,44Z", muscles: ["traps"] },
    // Back (lats)
    { d: "M34,54 Q42,50 50,52 Q50,72 42,76 Q34,70 34,54Z", muscles: ["back"] },
    { d: "M66,54 Q58,50 50,52 Q50,72 58,76 Q66,70 66,54Z", muscles: ["back"] },
    // Rear delts
    { d: "M28,48 Q32,50 34,54 Q30,58 26,56 Q26,50 28,48Z", muscles: ["shoulders"] },
    { d: "M72,48 Q68,50 66,54 Q70,58 74,56 Q74,50 72,48Z", muscles: ["shoulders"] },
    // Triceps
    { d: "M26,60 Q24,70 26,78 Q30,76 30,68 Q28,62 26,60Z", muscles: ["triceps"] },
    { d: "M74,60 Q76,70 74,78 Q70,76 70,68 Q72,62 74,60Z", muscles: ["triceps"] },
    // Glutes
    { d: "M38,80 Q50,76 62,80 Q62,92 50,94 Q38,92 38,80Z", muscles: ["glutes"] },
    // Hamstrings
    { d: "M38,96 Q44,94 48,96 Q48,114 44,118 Q38,116 38,104Z", muscles: ["hamstrings"] },
    { d: "M62,96 Q56,94 52,96 Q52,114 56,118 Q62,116 62,104Z", muscles: ["hamstrings"] },
    // Calves (back)
    { d: "M40,120 Q44,118 48,120 Q48,136 44,142 Q40,140 40,130Z", muscles: ["calves"] },
    { d: "M60,120 Q56,118 52,120 Q52,136 56,142 Q60,140 60,130Z", muscles: ["calves"] },
  ],
};

interface Props {
  loads: MuscleLoad[];
}

export function MuscleMap({ loads }: Props) {
  const loadMap = Object.fromEntries(loads.map((l) => [l.muscle, l]));

  const renderBody = (view: "front" | "back") => (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-[9px] font-medium tracking-[0.2em] text-tm uppercase">{view}</p>
      <svg viewBox="20 30 60 120" className="h-[200px] w-auto">
        {/* Body outline */}
        <ellipse cx="50" cy="36" rx="8" ry="9" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />
        <path d="M42,45 Q30,48 24,60 Q20,76 24,96 L28,96 Q26,80 30,66 Q32,58 40,52Z" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />
        <path d="M58,45 Q70,48 76,60 Q80,76 76,96 L72,96 Q74,80 70,66 Q68,58 60,52Z" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />
        <path d="M42,45 Q50,44 58,45 Q60,60 62,80 Q62,95 60,95 Q50,96 40,95 Q38,95 38,80 Q40,60 42,45Z" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />
        <path d="M40,95 Q44,94 48,96 Q48,120 46,142 L42,142 Q40,120 40,95Z" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />
        <path d="M60,95 Q56,94 52,96 Q52,120 54,142 L58,142 Q60,120 60,95Z" fill="var(--card)" stroke="var(--edge)" strokeWidth="0.5" />

        {/* Muscle highlights */}
        {(MUSCLE_PATHS[view] || []).map((path, i) => {
          const primaryMuscle = path.muscles[0];
          const load = loadMap[primaryMuscle];
          if (!load || load.fatigue < 5) return null;
          return (
            <path
              key={i}
              d={path.d}
              fill={fatigueColor(load.fatigue)}
              opacity={fatigueOpacity(load.fatigue)}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="rounded-2xl border border-edge bg-card p-5">
      <h3 className="mb-2 text-[10px] font-medium tracking-[0.2em] text-t4 uppercase">
        Muscle Fatigue Map
      </h3>
      <p className="mb-4 text-[11px] font-light text-tm">Last 7 days training load</p>

      <div className="flex items-start justify-center gap-8">
        {renderBody("front")}
        {renderBody("back")}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {[
          { color: "#ef4444", label: "Fatigued" },
          { color: "#f97316", label: "Worked" },
          { color: "#eab308", label: "Recovering" },
          { color: "#22c55e", label: "Recovered" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color, opacity: 0.7 }} />
            <span className="text-[9px] text-tm">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Muscle list */}
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {loads
          .filter((l) => l.fatigue > 0)
          .sort((a, b) => b.fatigue - a.fatigue)
          .slice(0, 6)
          .map((l) => (
            <div key={l.muscle} className="flex items-center gap-2 rounded-lg bg-page px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: fatigueColor(l.fatigue) }} />
              <span className="text-[10px] capitalize text-t3">{l.muscle}</span>
              <span className="ml-auto text-[9px] text-tm">{fatigueLabel(l.fatigue)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
