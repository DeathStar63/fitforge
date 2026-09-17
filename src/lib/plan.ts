/**
 * The user's personal training plan.
 *
 * A plan is a set of routines plus an assignment of one routine (or rest) to
 * each day of the week. The three built-in routines reproduce the original
 * Legs / Push / Pull split exactly — same ids, same exercises, same rep ranges —
 * so existing workout history keeps resolving after the upgrade.
 */

import type { Exercise } from "./workouts";
import { EXERCISE_BY_ID, getLibraryExercise } from "./exerciseLibrary";
import { muscleLabel, type MuscleId } from "./muscles";

const PLAN_KEY = "fitforge_plan";
const CUSTOM_GIF_KEY = "fitforge_custom_gifs";

export interface RoutineExercise {
  exerciseId: string;
  /** Per-routine overrides; fall back to the library defaults when absent. */
  sets?: number;
  repsMin?: number;
  repsMax?: number;
}

export interface Routine {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  exercises: RoutineExercise[];
  /** Built-in routines can be edited but not deleted. */
  builtIn?: boolean;
}

export interface WeekPlan {
  version: 1;
  routines: Routine[];
  /** Index 0 = Sunday … 6 = Saturday. `null` means a rest day. */
  days: (string | null)[];
}

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: "legs",
    name: "Legs & Core",
    subtitle: "Quads, Hamstrings, Glutes, Abs",
    emoji: "🦵",
    builtIn: true,
    exercises: [
      { exerciseId: "barbell-squat" },
      { exerciseId: "romanian-deadlift" },
      { exerciseId: "leg-press" },
      { exerciseId: "leg-extension" },
      { exerciseId: "leg-curl" },
      { exerciseId: "barbell-hip-thrust" },
      { exerciseId: "seated-calf-raise" },
      { exerciseId: "decline-crunch" },
      { exerciseId: "cable-crunch" },
    ],
  },
  {
    id: "push",
    name: "Push",
    subtitle: "Chest, Shoulders, Triceps",
    emoji: "💪",
    builtIn: true,
    exercises: [
      { exerciseId: "barbell-bench-press" },
      { exerciseId: "incline-db-press" },
      { exerciseId: "cable-crossover" },
      { exerciseId: "seated-shoulder-press" },
      { exerciseId: "db-lateral-raise" },
      { exerciseId: "front-db-raise" },
      { exerciseId: "cable-overhead-tricep" },
      { exerciseId: "tricep-pushdown" },
      { exerciseId: "overhead-tricep-ext" },
    ],
  },
  {
    id: "pull",
    name: "Pull",
    subtitle: "Back, Biceps, Rear Delts",
    emoji: "🏋️",
    builtIn: true,
    exercises: [
      { exerciseId: "barbell-row" },
      { exerciseId: "lat-pulldown" },
      { exerciseId: "seated-cable-row" },
      { exerciseId: "straight-arm-pulldown" },
      { exerciseId: "face-pull" },
      { exerciseId: "single-arm-db-row" },
      { exerciseId: "dumbbell-bicep-curl" },
      { exerciseId: "preacher-curl" },
      { exerciseId: "hammer-curl" },
    ],
  },
];

/** The original schedule: Mon/Thu legs, Tue/Fri push, Wed/Sat pull, Sun rest. */
export function defaultPlan(): WeekPlan {
  return {
    version: 1,
    routines: DEFAULT_ROUTINES.map((r) => ({
      ...r,
      exercises: r.exercises.map((e) => ({ ...e })),
    })),
    days: [null, "legs", "push", "pull", "legs", "push", "pull"],
  };
}

function isValidPlan(value: unknown): value is WeekPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<WeekPlan>;
  return (
    Array.isArray(p.routines) &&
    Array.isArray(p.days) &&
    p.days.length === 7 &&
    p.routines.every((r) => typeof r?.id === "string" && Array.isArray(r.exercises))
  );
}

export function getPlan(): WeekPlan {
  if (typeof window === "undefined") return defaultPlan();
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return defaultPlan();
    const parsed = JSON.parse(raw);
    if (!isValidPlan(parsed)) return defaultPlan();
    // Drop references to exercises that no longer exist in the library.
    parsed.routines = parsed.routines.map((r) => ({
      ...r,
      exercises: r.exercises.filter((e) => Boolean(EXERCISE_BY_ID[e.exerciseId])),
    }));
    const ids = new Set(parsed.routines.map((r) => r.id));
    parsed.days = parsed.days.map((d) => (d && ids.has(d) ? d : null));
    return parsed;
  } catch {
    return defaultPlan();
  }
}

export function savePlan(plan: WeekPlan): void {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function resetPlan(): WeekPlan {
  const plan = defaultPlan();
  savePlan(plan);
  return plan;
}

export function getRoutine(plan: WeekPlan, routineId: string | null): Routine | null {
  if (!routineId) return null;
  return plan.routines.find((r) => r.id === routineId) ?? null;
}

/** The routine scheduled for a weekday (0 = Sunday), or null on a rest day. */
export function getRoutineForDay(plan: WeekPlan, dayNumber: number): Routine | null {
  return getRoutine(plan, plan.days[dayNumber] ?? null);
}

/** Every weekday a routine is scheduled on. */
export function daysForRoutine(plan: WeekPlan, routineId: string): number[] {
  return plan.days
    .map((id, day) => (id === routineId ? day : -1))
    .filter((day) => day >= 0);
}

export function newRoutineId(plan: WeekPlan): string {
  let n = plan.routines.length + 1;
  let id = `routine-${n}`;
  const taken = new Set(plan.routines.map((r) => r.id));
  while (taken.has(id)) {
    n += 1;
    id = `routine-${n}`;
  }
  return id;
}

// ---------------------------------------------------------------------------
// Custom GIFs
// ---------------------------------------------------------------------------

/** User-supplied GIF/image URLs, keyed by exercise id. */
export function getCustomGifs(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_GIF_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setCustomGif(exerciseId: string, url: string | null): void {
  const all = getCustomGifs();
  if (url) all[exerciseId] = url;
  else delete all[exerciseId];
  localStorage.setItem(CUSTOM_GIF_KEY, JSON.stringify(all));
}

// ---------------------------------------------------------------------------
// Resolution to the runtime Exercise shape used by the training screen
// ---------------------------------------------------------------------------

export function resolveExercise(ref: RoutineExercise): Exercise | null {
  const lib = getLibraryExercise(ref.exerciseId);
  if (!lib) return null;
  const custom = getCustomGifs()[ref.exerciseId];
  return {
    id: lib.id,
    name: lib.name,
    muscle: lib.muscle,
    gifUrl: custom || lib.gifUrl || "",
    sets: ref.sets ?? lib.defaultSets,
    targetRepsMin: ref.repsMin ?? lib.defaultRepsMin,
    targetRepsMax: ref.repsMax ?? lib.defaultRepsMax,
  };
}

export function resolveRoutine(routine: Routine): Exercise[] {
  return routine.exercises
    .map(resolveExercise)
    .filter((e): e is Exercise => e !== null);
}

// ---------------------------------------------------------------------------
// Quick sessions
// ---------------------------------------------------------------------------

/**
 * A muscle-targeted session started from the body map lives in the plan as an
 * ordinary routine with a reserved id. Reusing a routine rather than inventing
 * a parallel "ad-hoc workout" concept means it already syncs, already appears
 * as a tab on the training screen, already logs against a workout id, and can
 * be edited or scheduled like anything else. Starting a new one replaces its
 * contents.
 */
export const QUICK_ROUTINE_ID = "quick";

export function isQuickRoutine(routine: Routine): boolean {
  return routine.id === QUICK_ROUTINE_ID;
}

export function upsertQuickRoutine(
  plan: WeekPlan,
  exerciseIds: string[],
  muscles: MuscleId[]
): WeekPlan {
  const names = muscles.map(muscleLabel);
  const subtitle =
    names.length === 0
      ? "Muscle-targeted session"
      : names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;

  const routine: Routine = {
    id: QUICK_ROUTINE_ID,
    name: "Quick Session",
    subtitle,
    emoji: "⚡",
    exercises: exerciseIds
      .filter((id) => Boolean(EXERCISE_BY_ID[id]))
      .map((exerciseId) => ({ exerciseId })),
  };

  const existing = plan.routines.some((r) => r.id === QUICK_ROUTINE_ID);
  return {
    ...plan,
    routines: existing
      ? plan.routines.map((r) => (r.id === QUICK_ROUTINE_ID ? routine : r))
      : [...plan.routines, routine],
  };
}
