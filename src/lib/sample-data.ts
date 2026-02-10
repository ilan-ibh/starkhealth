// ── Types ────────────────────────────────────────────────────────────────────

export interface DayData {
  date: string;
  // Whoop
  recovery: number;
  hrv: number;
  rhr: number;
  sleepHours: number;
  sleepScore: number;
  strain: number;
  calories: number;
  // Sleep stages (hours)
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  awake: number;
  // Withings
  weight: number;
  bodyFat: number;
  muscleMass: number;
  steps: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function seed(n: number): number {
  const x = Math.sin(n * 9301 + 49297) % 233280;
  return Math.abs(x / 233280);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function r1(v: number) {
  return Math.round(v * 10) / 10;
}

// ── Generator ────────────────────────────────────────────────────────────────

function generate(): DayData[] {
  const out: DayData[] = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(2026, 0, 11 + i);
    const ds = date.toISOString().split("T")[0];
    const p = i / 29; // progress 0→1
    const r = (s: number) => seed(i * 13 + s);

    // ── Whoop ──
    const recovery = Math.round(clamp(60 + p * 20 + (r(1) - 0.5) * 30, 28, 99));
    const hrv = Math.round(clamp(42 + p * 22 + (r(2) - 0.5) * 22, 22, 95));
    const rhr = Math.round(clamp(56 - p * 6 + (r(3) - 0.5) * 8, 42, 65));
    const sleepHours = r1(clamp(7.0 + p * 0.4 + (r(4) - 0.5) * 2.4, 5.2, 9.0));
    const sleepScore = Math.round(
      clamp(sleepHours * 11.5 + (r(5) - 0.5) * 15, 40, 99)
    );

    const deepSleep = r1(clamp(sleepHours * 0.18 + (r(6) - 0.5) * 0.6, 0.5, 2.5));
    const remSleep = r1(clamp(sleepHours * 0.22 + (r(7) - 0.5) * 0.5, 0.8, 2.8));
    const awake = r1(clamp(0.3 + (r(8) - 0.5) * 0.4, 0.1, 0.8));
    const lightSleep = r1(Math.max(sleepHours - deepSleep - remSleep - awake, 1.0));

    const isWorkout = r(9) > 0.3;
    const strain = r1(
      clamp(isWorkout ? 13 + (r(10) - 0.5) * 8 : 7 + (r(11) - 0.5) * 4, 3, 20.5)
    );
    const calories = Math.round(
      clamp(1800 + strain * 80 + (r(12) - 0.5) * 300, 1600, 3500)
    );

    // ── Withings ──
    const weight = r1(clamp(80.2 - p * 1.7 + (r(13) - 0.5) * 0.8, 77.0, 82.0));
    const bodyFat = r1(clamp(20.0 - p * 1.5 + (r(14) - 0.5) * 0.6, 17.0, 22.0));
    const muscleMass = r1(clamp(35.5 + p * 0.8 + (r(15) - 0.5) * 0.4, 34.5, 37.5));
    const steps = Math.round(
      clamp(8000 + (r(16) - 0.5) * 10000 + (isWorkout ? 2000 : 0), 2500, 18000)
    );

    out.push({
      date: ds,
      recovery,
      hrv,
      rhr,
      sleepHours,
      sleepScore,
      deepSleep,
      remSleep,
      lightSleep,
      awake,
      strain,
      calories,
      weight,
      bodyFat,
      muscleMass,
      steps,
    });
  }
  return out;
}

// ── Exported data & utilities ────────────────────────────────────────────────

export const sampleData = generate();

export function getLatest(): DayData {
  return sampleData[sampleData.length - 1];
}

export function getAverage(days: number, key: keyof Omit<DayData, "date">): number {
  const slice = sampleData.slice(-days);
  const sum = slice.reduce((acc, d) => acc + (d[key] as number), 0);
  return r1(sum / slice.length);
}

export function getDelta(key: keyof Omit<DayData, "date">): {
  delta: number;
  positive: boolean;
} {
  const today = sampleData[sampleData.length - 1][key] as number;
  const yesterday = sampleData[sampleData.length - 2][key] as number;
  const delta = r1(today - yesterday);
  const lowerBetter = ["rhr", "bodyFat", "weight", "awake"];
  return { delta, positive: lowerBetter.includes(key) ? delta <= 0 : delta >= 0 };
}

export function getSparkline(
  key: keyof Omit<DayData, "date">,
  days = 7
): number[] {
  return sampleData.slice(-days).map((d) => d[key] as number);
}

export function getHealthScore(trainingScore?: number): number {
  const d = getLatest();
  const rec = d.recovery * 0.25;
  const slp = d.sleepScore * 0.2;
  const hrvN = clamp(((d.hrv - 20) / 80) * 100, 0, 100) * 0.2;
  const body = clamp(75 + (36 - d.bodyFat) * 2, 50, 100) * 0.15;
  const train = (trainingScore ?? 70) * 0.2;
  return Math.round(rec + slp + hrvN + body + train);
}

// ── AI summary ───────────────────────────────────────────────────────────────

export function getDataSummaryForAI(): string {
  const t = getLatest();
  const f = sampleData[0];
  const a7 = (k: keyof Omit<DayData, "date">) => getAverage(7, k);

  return `
HEALTH DATA SUMMARY (${f.date} → ${t.date}, 30 days)

TODAY (${t.date}):
• Recovery ${t.recovery}% | HRV ${t.hrv} ms | RHR ${t.rhr} bpm
• Sleep ${t.sleepHours}h (score ${t.sleepScore}%) — Deep ${t.deepSleep}h, REM ${t.remSleep}h, Light ${t.lightSleep}h
• Strain ${t.strain} | Calories ${t.calories}
• Weight ${t.weight} kg | Body Fat ${t.bodyFat}% | Muscle ${t.muscleMass} kg
• Steps ${t.steps}

7-DAY AVERAGES:
• Recovery ${a7("recovery")}% | HRV ${a7("hrv")} ms | Sleep ${a7("sleepHours")}h
• Strain ${a7("strain")} | Steps ${a7("steps")}
• Weight ${a7("weight")} kg | Body Fat ${a7("bodyFat")}%

30-DAY DELTA:
• Recovery ${f.recovery}% → ${t.recovery}% (${t.recovery - f.recovery > 0 ? "+" : ""}${t.recovery - f.recovery}%)
• HRV ${f.hrv} → ${t.hrv} ms (${t.hrv - f.hrv > 0 ? "+" : ""}${t.hrv - f.hrv} ms)
• Weight ${f.weight} → ${t.weight} kg (${r1(t.weight - f.weight)} kg)
• Body Fat ${f.bodyFat} → ${t.bodyFat}% (${r1(t.bodyFat - f.bodyFat)}%)
• Muscle ${f.muscleMass} → ${t.muscleMass} kg (+${r1(t.muscleMass - f.muscleMass)} kg)

FULL DAILY DATA (JSON):
${JSON.stringify(sampleData)}

WORKOUT DATA (from Hevy):
The user trains 4-5x per week (Push/Pull/Legs/Upper split).
Key lifts: Bench Press ~82kg, Squat ~104kg, Deadlift ~126kg, OHP ~52kg.
All lifts show progressive overload over 30 days.
Total volume: ~150,000+ kg lifted this month.
Training consistency is good — average 4.5 sessions/week.
Recent muscle fatigue: chest and quads are most fatigued (trained yesterday), back is recovering, legs were last trained 2 days ago.
`.trim();
}
