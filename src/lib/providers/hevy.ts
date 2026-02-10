const API = "https://api.hevyapp.com";

export interface HevySet {
  weight_kg: number;
  reps: number;
  rpe: number | null;
  type: "normal" | "warmup" | "dropset";
}

export interface HevyExercise {
  name: string;
  muscle_group: string;
  secondary_muscles: string[];
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  date: string;
  title: string;
  duration_min: number;
  exercises: HevyExercise[];
}

// Hevy muscle names → our body map names
const MUSCLE_NAME_MAP: Record<string, string> = {
  abdominals: "core",
  adductors: "quads",
  biceps: "biceps",
  calves: "calves",
  cardio: "core",
  chest: "chest",
  forearms: "forearms",
  full_body: "core",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "back",
  lower_back: "back",
  quadriceps: "quads",
  shoulders: "shoulders",
  traps: "traps",
  triceps: "triceps",
  upper_back: "back",
  other: "core",
};

function mapMuscle(hevyName: string): string {
  return MUSCLE_NAME_MAP[hevyName] || "core";
}

// Fetch all exercise templates to build muscle group mapping
async function fetchExerciseTemplates(apiKey: string): Promise<Record<string, { primary: string; secondary: string[] }>> {
  const templateMap: Record<string, { primary: string; secondary: string[] }> = {};
  let page = 1;

  while (page <= 20) {
    const res = await fetch(`${API}/v1/exercise_templates?page=${page}&pageSize=100`, {
      headers: { "api-key": apiKey },
    });

    if (!res.ok) break;
    const data = await res.json();
    const templates = data.exercise_templates || [];

    if (templates.length === 0) break;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const t of templates as any[]) {
      templateMap[t.id] = {
        primary: mapMuscle(t.primary_muscle_group || "other"),
        secondary: (t.secondary_muscle_groups || []).map((m: string) => mapMuscle(m)),
      };
    }

    if (page >= (data.page_count || 1)) break;
    page++;
  }

  return templateMap;
}

export async function fetchHevyData(apiKey: string): Promise<HevyWorkout[]> {
  // Fetch exercise templates first for muscle group mapping
  const templateMap = await fetchExerciseTemplates(apiKey);

  const allWorkouts: HevyWorkout[] = [];
  let page = 1;
  const pageSize = 10;

  while (page <= 5) {
    const res = await fetch(`${API}/v1/workouts?page=${page}&pageSize=${pageSize}`, {
      headers: { "api-key": apiKey },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Invalid Hevy API key");
      break;
    }

    const data = await res.json();
    const workouts = data.workouts || data;

    if (!Array.isArray(workouts) || workouts.length === 0) break;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const w of workouts as any[]) {
      const startTime = w.start_time || w.created_at;
      const endTime = w.end_time || w.updated_at;
      const durationMin = startTime && endTime
        ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
        : 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exercises: HevyExercise[] = (w.exercises || []).map((ex: any) => {
        // Look up muscle groups from exercise template
        const templateId = ex.exercise_template_id;
        const muscles = templateMap[templateId] || { primary: "core", secondary: [] };

        return {
          name: ex.title || "Unknown",
          muscle_group: muscles.primary,
          secondary_muscles: muscles.secondary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sets: (ex.sets || []).map((s: any) => ({
            weight_kg: s.weight_kg || 0,
            reps: s.reps || 0,
            rpe: s.rpe || null,
            type: s.type === "warmup" ? "warmup" as const : "normal" as const,
          })),
        };
      });

      allWorkouts.push({
        id: w.id,
        date: startTime ? new Date(startTime).toISOString().split("T")[0] : "",
        title: w.title || "Workout",
        duration_min: durationMin,
        exercises,
      });
    }

    if (page >= (data.page_count || 1)) break;
    page++;
  }

  return allWorkouts.sort((a, b) => a.date.localeCompare(b.date));
}
