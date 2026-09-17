/**
 * Runtime workout shapes.
 *
 * The concrete schedule no longer lives here — it is user-owned and stored in
 * `lib/plan.ts`. This module keeps the types the training screen works with and
 * the helpers that turn a plan into them.
 */

import {
  getPlan,
  getRoutineForDay,
  resolveRoutine,
  daysForRoutine,
  type Routine,
  type WeekPlan,
} from "./plan";

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl: string;
  sets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  completed: boolean;
}

export interface WorkoutDay {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  exercises: Exercise[];
  dayNumbers: number[]; // 0=Sun, 1=Mon, ...
}

export function routineToWorkoutDay(routine: Routine, plan: WeekPlan): WorkoutDay {
  return {
    id: routine.id,
    name: routine.name,
    subtitle: routine.subtitle,
    emoji: routine.emoji,
    exercises: resolveRoutine(routine),
    dayNumbers: daysForRoutine(plan, routine.id),
  };
}

/** Every routine in the user's plan, in plan order. */
export function getWorkoutDays(plan: WeekPlan = getPlan()): WorkoutDay[] {
  return plan.routines.map((r) => routineToWorkoutDay(r, plan));
}

export function getTodaysWorkout(plan: WeekPlan = getPlan()): WorkoutDay | null {
  return getWorkoutByDay(new Date().getDay(), plan);
}

export function getWorkoutByDay(
  dayNumber: number,
  plan: WeekPlan = getPlan()
): WorkoutDay | null {
  const routine = getRoutineForDay(plan, dayNumber);
  return routine ? routineToWorkoutDay(routine, plan) : null;
}

export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
