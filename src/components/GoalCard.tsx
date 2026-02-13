"use client";

interface Goal {
  id: string;
  metric: string;
  label: string;
  target_value: number;
  direction: "increase" | "decrease";
  target_date: string | null;
}

interface Props {
  goals: Goal[];
  currentValues: Record<string, number>;
  onDelete: (id: string) => void;
}

export function GoalCards({ goals, currentValues, onDelete }: Props) {
  if (goals.length === 0) return null;

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const current = currentValues[goal.metric] ?? 0;
        const start = goal.direction === "decrease"
          ? Math.max(current, goal.target_value) + (Math.abs(current - goal.target_value) * 0.5)
          : Math.min(current, goal.target_value) - (Math.abs(current - goal.target_value) * 0.5);

        let progress: number;
        if (goal.direction === "decrease") {
          progress = start === goal.target_value ? 100 : Math.max(0, Math.min(100, ((start - current) / (start - goal.target_value)) * 100));
        } else {
          progress = start === goal.target_value ? 100 : Math.max(0, Math.min(100, ((current - start) / (goal.target_value - start)) * 100));
        }

        const isAchieved = goal.direction === "decrease"
          ? current <= goal.target_value
          : current >= goal.target_value;

        const daysLeft = goal.target_date
          ? Math.max(0, Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000))
          : null;

        return (
          <div key={goal.id} className="group rounded-xl border border-edge bg-page p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-light text-t1">{goal.label}</p>
                <p className="mt-0.5 text-[10px] text-tm">
                  {current} → {goal.target_value}
                  {goal.target_date && ` · ${daysLeft}d left`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAchieved && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-500">Achieved</span>
                )}
                <button onClick={() => onDelete(goal.id)} className="text-tm opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-edge">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isAchieved ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[9px] text-tm">{Math.round(progress)}%</p>
          </div>
        );
      })}
    </div>
  );
}
