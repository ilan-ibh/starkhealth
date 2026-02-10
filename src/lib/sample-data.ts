// ── Types for unified daily health data ──────────────────────────────────

export interface DayData {
  date: string;
  // Whoop
  recovery: number | null;
  hrv: number | null;
  rhr: number | null;
  sleepHours: number | null;
  sleepScore: number | null;
  strain: number | null;
  calories: number | null;
  // Sleep stages (hours)
  deepSleep: number | null;
  remSleep: number | null;
  lightSleep: number | null;
  awake: number | null;
  // Withings
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  steps: number | null;
}
