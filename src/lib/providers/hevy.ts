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
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  date: string;
  title: string;
  duration_min: number;
  exercises: HevyExercise[];
}

export async function fetchHevyData(apiKey: string): Promise<HevyWorkout[]> {
  const allWorkouts: HevyWorkout[] = [];
  let page = 1;
  const pageSize = 10;

  // Fetch up to 3 pages (30 workouts)
  while (page <= 3) {
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
      const exercises: HevyExercise[] = (w.exercises || []).map((ex: any) => ({
        name: ex.title || ex.exercise_template_id || "Unknown",
        muscle_group: ex.muscle_group || "other",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sets: (ex.sets || []).map((s: any) => ({
          weight_kg: s.weight_kg || 0,
          reps: s.reps || 0,
          rpe: s.rpe || null,
          type: s.set_type === "warmup" ? "warmup" as const : "normal" as const,
        })),
      }));

      allWorkouts.push({
        id: w.id,
        date: startTime ? new Date(startTime).toISOString().split("T")[0] : "",
        title: w.title || "Workout",
        duration_min: durationMin,
        exercises,
      });
    }

    if (workouts.length < pageSize) break;
    page++;
  }

  return allWorkouts.sort((a, b) => a.date.localeCompare(b.date));
}
