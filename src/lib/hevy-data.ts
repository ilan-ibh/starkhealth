// ── Types for Hevy workout data and muscle mapping ───────────────────────

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "traps";

export interface MuscleLoad {
  muscle: MuscleGroup;
  sets: number;
  volume: number;
  lastWorked: string;
  fatigue: number;
}

export interface PersonalRecord {
  exercise: string;
  weight_kg: number;
  reps: number;
  date: string;
  previous_kg: number;
}
