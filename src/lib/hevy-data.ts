// ── Types matching Hevy API structure ─────────────────────────────────────

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

export interface HevySet {
  weight_kg: number;
  reps: number;
  rpe: number | null;
  type: "normal" | "warmup" | "dropset";
}

export interface HevyExercise {
  name: string;
  muscle_group: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  date: string;
  title: string;
  duration_min: number;
  exercises: HevyExercise[];
}

export interface MuscleLoad {
  muscle: MuscleGroup;
  sets: number;
  volume: number; // total kg × reps
  lastWorked: string; // date
  fatigue: number; // 0-100
}

export interface PersonalRecord {
  exercise: string;
  weight_kg: number;
  reps: number;
  date: string;
  previous_kg: number;
}

// ── Sample data generator ────────────────────────────────────────────────

function seed(n: number): number {
  const x = Math.sin(n * 9301 + 49297) % 233280;
  return Math.abs(x / 233280);
}

const WORKOUTS_TEMPLATES: {
  title: string;
  exercises: { name: string; muscle: MuscleGroup; secondary: MuscleGroup[]; baseWeight: number; baseReps: number }[];
}[] = [
  {
    title: "Push Day",
    exercises: [
      { name: "Bench Press", muscle: "chest", secondary: ["triceps", "shoulders"], baseWeight: 80, baseReps: 8 },
      { name: "Overhead Press", muscle: "shoulders", secondary: ["triceps"], baseWeight: 50, baseReps: 8 },
      { name: "Incline Dumbbell Press", muscle: "chest", secondary: ["shoulders"], baseWeight: 30, baseReps: 10 },
      { name: "Lateral Raises", muscle: "shoulders", secondary: [], baseWeight: 12, baseReps: 12 },
      { name: "Tricep Pushdown", muscle: "triceps", secondary: [], baseWeight: 25, baseReps: 12 },
    ],
  },
  {
    title: "Pull Day",
    exercises: [
      { name: "Deadlift", muscle: "back", secondary: ["hamstrings", "glutes", "traps"], baseWeight: 120, baseReps: 5 },
      { name: "Barbell Row", muscle: "back", secondary: ["biceps"], baseWeight: 70, baseReps: 8 },
      { name: "Pull-ups", muscle: "back", secondary: ["biceps"], baseWeight: 0, baseReps: 10 },
      { name: "Face Pulls", muscle: "shoulders", secondary: ["traps"], baseWeight: 15, baseReps: 15 },
      { name: "Barbell Curl", muscle: "biceps", secondary: ["forearms"], baseWeight: 30, baseReps: 10 },
    ],
  },
  {
    title: "Leg Day",
    exercises: [
      { name: "Squat", muscle: "quads", secondary: ["glutes", "core"], baseWeight: 100, baseReps: 6 },
      { name: "Romanian Deadlift", muscle: "hamstrings", secondary: ["glutes", "back"], baseWeight: 80, baseReps: 8 },
      { name: "Leg Press", muscle: "quads", secondary: ["glutes"], baseWeight: 150, baseReps: 10 },
      { name: "Walking Lunges", muscle: "quads", secondary: ["glutes", "hamstrings"], baseWeight: 20, baseReps: 12 },
      { name: "Calf Raises", muscle: "calves", secondary: [], baseWeight: 60, baseReps: 15 },
    ],
  },
  {
    title: "Upper Body",
    exercises: [
      { name: "Bench Press", muscle: "chest", secondary: ["triceps", "shoulders"], baseWeight: 80, baseReps: 8 },
      { name: "Barbell Row", muscle: "back", secondary: ["biceps"], baseWeight: 70, baseReps: 8 },
      { name: "Dumbbell Shoulder Press", muscle: "shoulders", secondary: ["triceps"], baseWeight: 24, baseReps: 10 },
      { name: "Cable Fly", muscle: "chest", secondary: [], baseWeight: 15, baseReps: 12 },
      { name: "Hammer Curl", muscle: "biceps", secondary: ["forearms"], baseWeight: 14, baseReps: 12 },
    ],
  },
];

// Generate 30 days of workouts (4-5 per week)
function generateWorkouts(): HevyWorkout[] {
  const workouts: HevyWorkout[] = [];
  let templateIdx = 0;

  for (let day = 0; day < 30; day++) {
    const date = new Date(2026, 0, 11 + day);
    const dayOfWeek = date.getDay();
    const r = seed(day * 7 + 3);

    // Rest days: Sunday and some Wednesdays
    if (dayOfWeek === 0 || (dayOfWeek === 3 && r < 0.4) || (dayOfWeek === 6 && r < 0.3)) continue;

    const template = WORKOUTS_TEMPLATES[templateIdx % WORKOUTS_TEMPLATES.length];
    templateIdx++;

    const progress = day / 29; // progressive overload factor

    const exercises: HevyExercise[] = template.exercises.map((ex, ei) => {
      const sets: HevySet[] = [];
      const numSets = ex.muscle === "chest" || ex.muscle === "back" || ex.muscle === "quads" ? 4 : 3;

      for (let s = 0; s < numSets; s++) {
        const variation = (seed(day * 100 + ei * 10 + s) - 0.5) * 0.1;
        const progressWeight = ex.baseWeight > 0 ? ex.baseWeight * (1 + progress * 0.08 + variation) : 0;
        const repsVariation = Math.round((seed(day * 200 + ei * 10 + s) - 0.5) * 3);

        sets.push({
          weight_kg: Math.round(progressWeight * 2) / 2, // round to 0.5
          reps: Math.max(3, ex.baseReps + repsVariation - (s > 2 ? 2 : 0)), // fatigue on later sets
          rpe: s === numSets - 1 ? Math.round(8 + seed(day + ei) * 2) : null,
          type: s === 0 && ex.baseWeight > 50 ? "warmup" : "normal",
        });
      }

      return {
        name: ex.name,
        muscle_group: ex.muscle,
        secondary_muscles: ex.secondary,
        sets,
      };
    });

    workouts.push({
      id: `w-${day}`,
      date: date.toISOString().split("T")[0],
      title: template.title,
      duration_min: Math.round(45 + seed(day * 5) * 30),
      exercises,
    });
  }

  return workouts;
}

// ── Exported data & utilities ────────────────────────────────────────────

export const hevyWorkouts = generateWorkouts();

// Weekly workout frequency
export function getWorkoutFrequency(): { week: string; count: number }[] {
  const weeks: Record<string, number> = {};
  for (const w of hevyWorkouts) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}

// Total volume per week (kg lifted)
export function getWeeklyVolume(): { week: string; volume: number }[] {
  const weeks: Record<string, number> = {};
  for (const w of hevyWorkouts) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let vol = 0;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.type !== "warmup") vol += s.weight_kg * s.reps;
      }
    }
    weeks[key] = (weeks[key] || 0) + vol;
  }
  return Object.entries(weeks).map(([week, volume]) => ({ week, volume: Math.round(volume) }));
}

// Muscle load map (for body heat map)
export function getMuscleLoads(): MuscleLoad[] {
  const loads: Record<string, { sets: number; volume: number; lastWorked: string }> = {};
  const allMuscles: MuscleGroup[] = [
    "chest", "back", "shoulders", "biceps", "triceps", "forearms",
    "core", "quads", "hamstrings", "glutes", "calves", "traps",
  ];

  for (const m of allMuscles) {
    loads[m] = { sets: 0, volume: 0, lastWorked: "" };
  }

  // Look at last 7 days
  const recent = hevyWorkouts.slice(-Math.min(hevyWorkouts.length, 8));
  for (const w of recent) {
    for (const ex of w.exercises) {
      const muscles = [ex.muscle_group, ...ex.secondary_muscles];
      for (const m of muscles) {
        const isPrimary = m === ex.muscle_group;
        for (const s of ex.sets) {
          if (s.type !== "warmup") {
            loads[m].sets += isPrimary ? 1 : 0.5;
            loads[m].volume += (s.weight_kg * s.reps) * (isPrimary ? 1 : 0.4);
          }
        }
        if (!loads[m].lastWorked || w.date > loads[m].lastWorked) {
          loads[m].lastWorked = w.date;
        }
      }
    }
  }

  return allMuscles.map((m) => {
    const l = loads[m];
    // Fatigue based on recency + volume
    const daysSince = l.lastWorked
      ? Math.max(0, (Date.now() - new Date(l.lastWorked).getTime()) / 86400000)
      : 99;
    const recencyFactor = daysSince < 1 ? 90 : daysSince < 2 ? 70 : daysSince < 3 ? 45 : daysSince < 5 ? 20 : 0;
    const volumeFactor = Math.min(l.sets * 3, 40);
    const fatigue = Math.min(Math.round(recencyFactor + volumeFactor), 100);

    return {
      muscle: m,
      sets: Math.round(l.sets),
      volume: Math.round(l.volume),
      lastWorked: l.lastWorked,
      fatigue,
    };
  });
}

// Strength progression for key lifts
export function getStrengthProgress(): { exercise: string; data: { date: string; weight: number }[] }[] {
  const lifts = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];
  return lifts.map((name) => {
    const data: { date: string; weight: number }[] = [];
    for (const w of hevyWorkouts) {
      for (const ex of w.exercises) {
        if (ex.name === name) {
          const topSet = ex.sets
            .filter((s) => s.type === "normal")
            .reduce((best, s) => (s.weight_kg > best.weight_kg ? s : best), { weight_kg: 0, reps: 0, rpe: null, type: "normal" as const });
          if (topSet.weight_kg > 0) {
            data.push({
              date: new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              weight: topSet.weight_kg,
            });
          }
        }
      }
    }
    return { exercise: name, data };
  });
}

// Personal records
export function getPersonalRecords(): PersonalRecord[] {
  const bestByExercise: Record<string, { weight: number; reps: number; date: string; prevWeight: number }> = {};

  for (const w of hevyWorkouts) {
    for (const ex of w.exercises) {
      const topSet = ex.sets
        .filter((s) => s.type === "normal")
        .reduce((best, s) => (s.weight_kg > best.weight_kg ? s : best), { weight_kg: 0, reps: 0, rpe: null, type: "normal" as const });

      if (topSet.weight_kg > 0) {
        const key = ex.name;
        if (!bestByExercise[key] || topSet.weight_kg > bestByExercise[key].weight) {
          bestByExercise[key] = {
            prevWeight: bestByExercise[key]?.weight || topSet.weight_kg * 0.95,
            weight: topSet.weight_kg,
            reps: topSet.reps,
            date: w.date,
          };
        }
      }
    }
  }

  return Object.entries(bestByExercise)
    .map(([exercise, d]) => ({
      exercise,
      weight_kg: d.weight,
      reps: d.reps,
      date: d.date,
      previous_kg: Math.round(d.prevWeight * 2) / 2,
    }))
    .sort((a, b) => b.weight_kg - a.weight_kg)
    .slice(0, 5);
}

// Summary stats
export function getHevySummary() {
  const total = hevyWorkouts.length;
  const totalVolume = hevyWorkouts.reduce((sum, w) => {
    return sum + w.exercises.reduce((eSum, ex) => {
      return eSum + ex.sets.filter((s) => s.type !== "warmup").reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
    }, 0);
  }, 0);
  const avgDuration = Math.round(hevyWorkouts.reduce((s, w) => s + w.duration_min, 0) / total);
  const last7 = hevyWorkouts.filter((w) => {
    const d = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return {
    totalWorkouts: total,
    totalVolume: Math.round(totalVolume),
    avgDuration,
    workoutsThisWeek: last7,
    avgPerWeek: Math.round((total / 4.3) * 10) / 10,
  };
}

// Training consistency score (0-100) for Stark Health Score
export function getTrainingScore(): number {
  const freq = getWorkoutFrequency();
  const avgFreq = freq.reduce((s, w) => s + w.count, 0) / freq.length;
  // 4-5 workouts/week is optimal
  const freqScore = Math.min(avgFreq / 5, 1) * 50;
  // Progressive overload check
  const progress = getStrengthProgress();
  let progressScore = 0;
  for (const lift of progress) {
    if (lift.data.length >= 2) {
      const first = lift.data[0].weight;
      const last = lift.data[lift.data.length - 1].weight;
      if (last > first) progressScore += 12.5;
    }
  }
  return Math.min(Math.round(freqScore + progressScore), 100);
}
