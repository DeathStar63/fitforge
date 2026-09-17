/**
 * Turns workout history into per-muscle state: how long ago each muscle was
 * trained, how many hard sets it got this week, and therefore what to hit next.
 *
 * Set counting: a completed set counts 1 set toward each primary muscle of the
 * exercise and 0.5 toward each secondary — the usual "direct vs indirect
 * volume" convention.
 */

import { MUSCLE_GROUPS, MUSCLE_BY_ID, type MuscleId } from "./muscles";
import { EXERCISE_BY_ID } from "./exerciseLibrary";
import type { DayWorkoutLog } from "./storage";

export type MuscleState = "worked" | "ready" | "due";

export interface MuscleStatus {
  muscle: MuscleId;
  /** YYYY-MM-DD of the most recent session with a completed set, if any. */
  lastTrained: string | null;
  /** Whole days since `lastTrained`; null when never trained. */
  daysSince: number | null;
  /** Weighted hard sets over the trailing 7 days. */
  weeklySets: number;
  /** Weighted hard sets logged today. */
  setsToday: number;
  weeklyTarget: number;
  state: MuscleState;
}

export type MuscleStatusMap = Record<MuscleId, MuscleStatus>;

/** Days of rest after which a muscle stops counting as freshly worked. */
const WORKED_WINDOW_DAYS = 2;
/** Days of rest after which a muscle is flagged as overdue. */
const DUE_AFTER_DAYS = 5;

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

export function computeMuscleStatuses(
  logs: Record<string, DayWorkoutLog>,
  today: Date = new Date()
): MuscleStatusMap {
  const todayKey = dateKey(today);

  const lastTrained: Partial<Record<MuscleId, string>> = {};
  const weeklySets: Partial<Record<MuscleId, number>> = {};
  const setsToday: Partial<Record<MuscleId, number>> = {};

  for (const log of Object.values(logs || {})) {
    if (!log?.date || !Array.isArray(log.exercises)) continue;
    const age = daysBetween(log.date, todayKey);
    if (age < 0) continue; // future-dated log, ignore

    for (const exLog of log.exercises) {
      const lib = EXERCISE_BY_ID[exLog.exerciseId];
      if (!lib) continue;
      const completed = exLog.sets.filter((s) => s.completed).length;
      if (completed === 0) continue;

      const contributions: [MuscleId, number][] = [
        ...lib.primary.map((m) => [m, completed] as [MuscleId, number]),
        ...lib.secondary.map((m) => [m, completed * 0.5] as [MuscleId, number]),
      ];

      for (const [muscle, sets] of contributions) {
        if (!MUSCLE_BY_ID[muscle]) continue;
        // Only direct (primary) work moves the "last trained" marker.
        const isPrimary = lib.primary.includes(muscle);
        if (isPrimary) {
          const prev = lastTrained[muscle];
          if (!prev || log.date > prev) lastTrained[muscle] = log.date;
        }
        if (age < 7) weeklySets[muscle] = (weeklySets[muscle] ?? 0) + sets;
        if (age === 0) setsToday[muscle] = (setsToday[muscle] ?? 0) + sets;
      }
    }
  }

  const result = {} as MuscleStatusMap;
  for (const group of MUSCLE_GROUPS) {
    const last = lastTrained[group.id] ?? null;
    const daysSince = last ? daysBetween(last, todayKey) : null;
    let state: MuscleState;
    if (daysSince === null || daysSince >= DUE_AFTER_DAYS) state = "due";
    else if (daysSince <= WORKED_WINDOW_DAYS) state = "worked";
    else state = "ready";

    result[group.id] = {
      muscle: group.id,
      lastTrained: last,
      daysSince,
      weeklySets: Math.round((weeklySets[group.id] ?? 0) * 10) / 10,
      setsToday: Math.round((setsToday[group.id] ?? 0) * 10) / 10,
      weeklyTarget: group.weeklySetTarget,
      state,
    };
  }
  return result;
}

export interface MuscleSuggestion {
  muscle: MuscleId;
  /** Higher = more urgent. */
  score: number;
  reason: string;
}

/**
 * Rank muscles by how badly they need work. Combines time since the last direct
 * session with how far this week's volume sits below the weekly target.
 */
export function suggestMuscles(
  statuses: MuscleStatusMap,
  limit = 4
): MuscleSuggestion[] {
  const suggestions: MuscleSuggestion[] = [];

  for (const group of MUSCLE_GROUPS) {
    const s = statuses[group.id];
    const volumeGap = Math.max(0, s.weeklyTarget - s.weeklySets) / s.weeklyTarget;
    const restScore = s.daysSince === null ? 10 : Math.min(s.daysSince, 14);
    const score = restScore + volumeGap * 6;

    // Freshly trained muscles are not candidates.
    if (s.state === "worked" && volumeGap < 0.4) continue;

    let reason: string;
    if (s.daysSince === null) {
      reason = "No direct work logged yet";
    } else if (s.daysSince >= DUE_AFTER_DAYS) {
      reason = `${s.daysSince} days since last session`;
    } else if (volumeGap > 0) {
      reason = `${s.weeklySets} of ${s.weeklyTarget} sets this week`;
    } else {
      reason = "Recovered and ready";
    }

    suggestions.push({ muscle: group.id, score, reason });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Muscles a routine would train, primaries only, in routine order. */
export function musclesInRoutine(exerciseIds: string[]): MuscleId[] {
  const seen = new Set<MuscleId>();
  for (const id of exerciseIds) {
    const lib = EXERCISE_BY_ID[id];
    if (!lib) continue;
    for (const m of lib.primary) seen.add(m);
  }
  return Array.from(seen);
}

export const MUSCLE_STATE_COLORS: Record<MuscleState, string> = {
  worked: "#DCF64F",
  ready: "#FBBF24",
  due: "#5B606C",
};

export const MUSCLE_STATE_LABELS: Record<MuscleState, string> = {
  worked: "Worked",
  ready: "Ready",
  due: "Needs work",
};
