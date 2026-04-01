import { ExerciseLog, SetLog } from "./workouts";

// Keys
const WORKOUT_LOG_KEY = "fitforge_workout_logs";
const NUTRITION_LOG_KEY = "fitforge_nutrition_logs";
const BODY_STATS_KEY = "fitforge_body_stats";
const INBODY_REPORTS_KEY = "fitforge_inbody_reports";

// Date helper
export function getDateKey(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ---- Workout Logs ----
export interface DayWorkoutLog {
  date: string;
  workoutId: string;
  exercises: ExerciseLog[];
  completedAt?: string;
}

export function getWorkoutLog(date?: string): DayWorkoutLog | null {
  const key = date || getDateKey();
  const logs = JSON.parse(localStorage.getItem(WORKOUT_LOG_KEY) || "{}");
  return logs[key] || null;
}

export function saveWorkoutLog(log: DayWorkoutLog): void {
  const logs = JSON.parse(localStorage.getItem(WORKOUT_LOG_KEY) || "{}");
  logs[log.date] = log;
  localStorage.setItem(WORKOUT_LOG_KEY, JSON.stringify(logs));
}

export function getLastWorkoutLog(
  workoutId: string,
  beforeDate?: string
): DayWorkoutLog | null {
  const logs: Record<string, DayWorkoutLog> = JSON.parse(
    localStorage.getItem(WORKOUT_LOG_KEY) || "{}"
  );
  const cutoff = beforeDate || getDateKey();
  const matching = Object.values(logs)
    .filter((l) => l.workoutId === workoutId && l.date < cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
  return matching[0] || null;
}

export function initExerciseLog(
  exerciseId: string,
  numSets: number
): ExerciseLog {
  return {
    exerciseId,
    sets: Array.from({ length: numSets }, (): SetLog => ({
      reps: 0,
      weight: 0,
      completed: false,
    })),
    completed: false,
  };
}

export function getBestSet(exerciseId: string): SetLog | null {
  const logs: Record<string, DayWorkoutLog> = JSON.parse(
    localStorage.getItem(WORKOUT_LOG_KEY) || "{}"
  );
  let best: SetLog | null = null;
  for (const log of Object.values(logs)) {
    const exercise = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) continue;
    for (const set of exercise.sets) {
      if (set.completed && set.weight > 0) {
        if (
          !best ||
          set.weight > best.weight ||
          (set.weight === best.weight && set.reps > best.reps)
        ) {
          best = { ...set };
        }
      }
    }
  }
  return best;
}

export function getAllWorkoutLogs(): Record<string, DayWorkoutLog> {
  return JSON.parse(localStorage.getItem(WORKOUT_LOG_KEY) || "{}");
}

// ---- Nutrition Logs ----
export interface NutritionEntry {
  id: string;
  timestamp: string;
  description: string;
  items: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    quantity: string;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface DayNutritionLog {
  date: string;
  entries: NutritionEntry[];
}

export function getNutritionLog(date?: string): DayNutritionLog {
  const key = date || getDateKey();
  const logs = JSON.parse(localStorage.getItem(NUTRITION_LOG_KEY) || "{}");
  return logs[key] || { date: key, entries: [] };
}

export function saveNutritionEntry(entry: NutritionEntry, date?: string): void {
  const key = date || getDateKey();
  const logs = JSON.parse(localStorage.getItem(NUTRITION_LOG_KEY) || "{}");
  if (!logs[key]) {
    logs[key] = { date: key, entries: [] };
  }
  logs[key].entries.push(entry);
  localStorage.setItem(NUTRITION_LOG_KEY, JSON.stringify(logs));
}

export function deleteNutritionEntry(entryId: string, date?: string): void {
  const key = date || getDateKey();
  const logs = JSON.parse(localStorage.getItem(NUTRITION_LOG_KEY) || "{}");
  if (logs[key]) {
    logs[key].entries = logs[key].entries.filter(
      (e: NutritionEntry) => e.id !== entryId
    );
    localStorage.setItem(NUTRITION_LOG_KEY, JSON.stringify(logs));
  }
}

// ---- Body Stats ----
export interface BodyStats {
  date: string;
  weight: number;
  height: number;
  age: number;
  bmi: number;
  bodyFat?: number;
  notes?: string;
}

export function getBodyStats(): BodyStats[] {
  return JSON.parse(localStorage.getItem(BODY_STATS_KEY) || "[]");
}

export function saveBodyStats(stats: BodyStats): void {
  const all = getBodyStats();
  const existingIdx = all.findIndex((s) => s.date === stats.date);
  if (existingIdx >= 0) {
    all[existingIdx] = stats;
  } else {
    all.push(stats);
  }
  all.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(BODY_STATS_KEY, JSON.stringify(all));
}

export function getLatestBodyStats(): BodyStats | null {
  const all = getBodyStats();
  return all.length > 0 ? all[all.length - 1] : null;
}

// ---- InBody Reports ----
export interface InBodyReport {
  id: string;
  date: string;
  imageData: string; // base64 thumbnail (compressed)
  analysis: string;
}

export function getInBodyReports(): InBodyReport[] {
  return JSON.parse(localStorage.getItem(INBODY_REPORTS_KEY) || "[]");
}

export function saveInBodyReport(report: InBodyReport): void {
  const all = getInBodyReports();
  all.push(report);
  all.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(INBODY_REPORTS_KEY, JSON.stringify(all));
}

export function deleteInBodyReport(id: string): void {
  const all = getInBodyReports().filter((r) => r.id !== id);
  localStorage.setItem(INBODY_REPORTS_KEY, JSON.stringify(all));
}
