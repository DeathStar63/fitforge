"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Flame, Moon, SlidersHorizontal } from "lucide-react";
import ExerciseCard from "./ExerciseCard";
import { dayNames, WorkoutDay } from "@/lib/workouts";
import { usePlan } from "@/context/PlanContext";
import {
  getWorkoutLog,
  saveWorkoutLog,
  getLastWorkoutLog,
  getBestSet,
  saveBestOverride,
  initExerciseLog,
  getDateKey,
  DayWorkoutLog,
} from "@/lib/storage";
import { useSync } from "@/context/SyncContext";
import type { ExerciseLog, SetLog } from "@/lib/workouts";

export default function TrainingTab({
  onOpenPlan,
  openWorkoutId,
}: {
  onOpenPlan?: () => void;
  /** A workout to open on arrival, e.g. a quick session just started from
   *  the body map. Takes precedence until the user picks another tab. */
  openWorkoutId?: string | null;
}) {
  const { syncAfterSave } = useSync();
  const { workoutDays, ready } = usePlan();
  const [selectedId, setSelectedId] = useState<string | null>(openWorkoutId ?? null);
  const [workoutLog, setWorkoutLog] = useState<DayWorkoutLog | null>(null);
  const [previousLog, setPreviousLog] = useState<DayWorkoutLog | null>(null);
  const [bestSets, setBestSets] = useState<Record<string, SetLog | null>>({});
  const today = new Date().getDay();

  const scheduledIdx = workoutDays.findIndex((w) => w.dayNumbers.includes(today));
  const isRestDay = scheduledIdx < 0;

  // Default to whatever is scheduled today; fall back to the first workout so
  // there is always something to log on a rest day.
  const selectedDayIdx = (() => {
    if (selectedId) {
      const idx = workoutDays.findIndex((w) => w.id === selectedId);
      if (idx >= 0) return idx;
    }
    return scheduledIdx >= 0 ? scheduledIdx : 0;
  })();

  const currentWorkout: WorkoutDay | undefined = workoutDays[selectedDayIdx];

  // Load today's log and line it up with the routine as it currently stands.
  // The routine is editable, so a stored log can be missing exercises, carry
  // ones that were removed, or have a stale set count — and the UI pairs
  // `workoutLog.exercises[i]` with `currentWorkout.exercises[i]` by position.
  useEffect(() => {
    if (!currentWorkout) return;
    const dateKey = getDateKey();
    const existing = getWorkoutLog(dateKey, currentWorkout.id);
    const previousEntries = existing ? existing.exercises : [];

    const exercises = currentWorkout.exercises.map((ex) => {
      const logged = previousEntries.find((e) => e.exerciseId === ex.id);
      if (!logged) return initExerciseLog(ex.id, ex.sets);
      if (logged.sets.length === ex.sets) return logged;
      // Set count changed in the plan editor: keep what was logged, then pad
      // or trim to the new length.
      const sets = Array.from({ length: ex.sets }, (_, i) =>
        logged.sets[i] ?? { reps: 0, weight: 0, completed: false }
      );
      return { ...logged, sets, completed: sets.every((set) => set.completed) };
    });

    const reconciled: DayWorkoutLog = {
      date: dateKey,
      workoutId: currentWorkout.id,
      exercises,
      completedAt:
        exercises.length > 0 && exercises.every((e) => e.completed)
          ? existing?.completedAt ?? new Date().toISOString()
          : undefined,
    };
    setWorkoutLog(reconciled);
    // Get previous session for same workout type
    const prev = getLastWorkoutLog(currentWorkout.id);
    setPreviousLog(prev);

    // Get personal bests for all exercises
    const bests: Record<string, SetLog | null> = {};
    for (const ex of currentWorkout.exercises) {
      bests[ex.id] = getBestSet(ex.id);
    }
    setBestSets(bests);
  }, [currentWorkout]);

  const handleSetUpdate = useCallback(
    (exerciseIdx: number, setIdx: number, field: "reps" | "weight", value: number) => {
      setWorkoutLog((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.exercises = [...updated.exercises];
        updated.exercises[exerciseIdx] = {
          ...updated.exercises[exerciseIdx],
          sets: [...updated.exercises[exerciseIdx].sets],
        };
        const currentSet = updated.exercises[exerciseIdx].sets[setIdx];
        const newSet = { ...currentSet, [field]: value };

        // Auto-complete when both weight and reps are filled
        const w = field === "weight" ? value : currentSet.weight;
        const r = field === "reps" ? value : currentSet.reps;
        if (w > 0 && r > 0) {
          newSet.completed = true;
        } else {
          newSet.completed = false;
        }

        updated.exercises[exerciseIdx].sets[setIdx] = newSet;
        updated.exercises[exerciseIdx] = {
          ...updated.exercises[exerciseIdx],
          completed: updated.exercises[exerciseIdx].sets.every((s) => s.completed),
        };

        // Check if whole workout is done
        if (updated.exercises.every((e) => e.completed)) {
          updated.completedAt = new Date().toISOString();
        } else {
          updated.completedAt = undefined;
        }

        saveWorkoutLog(updated);
        syncAfterSave("workout_logs");
        return updated;
      });
    },
    [syncAfterSave]
  );

  const handleSetToggle = useCallback(
    (exerciseIdx: number, setIdx: number) => {
      setWorkoutLog((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.exercises = [...updated.exercises];
        const exercise: ExerciseLog = {
          ...updated.exercises[exerciseIdx],
          sets: [...updated.exercises[exerciseIdx].sets],
        };
        exercise.sets[setIdx] = {
          ...exercise.sets[setIdx],
          completed: !exercise.sets[setIdx].completed,
        };
        exercise.completed = exercise.sets.every((s) => s.completed);
        updated.exercises[exerciseIdx] = exercise;

        // Check if whole workout is done
        if (updated.exercises.every((e) => e.completed)) {
          updated.completedAt = new Date().toISOString();
        }
        saveWorkoutLog(updated);
        syncAfterSave("workout_logs");
        return updated;
      });
    },
    [syncAfterSave]
  );

  const completedCount =
    workoutLog?.exercises.filter((e) => e.completed).length || 0;
  const totalExercises = currentWorkout?.exercises.length || 0;
  const progressPct =
    totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Training</h1>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            {dayNames[today]}
            <span className="text-text-subtle mx-1">|</span>
            <Clock size={14} />
            90 min + 30 min cardio
          </p>
        </div>
        {onOpenPlan && (
          <button
            onClick={onOpenPlan}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-surface text-xs font-medium text-text-muted"
          >
            <SlidersHorizontal size={13} />
            Plan
          </button>
        )}
      </div>

      {/* Rest day note */}
      {isRestDay && (
        <div className="mb-5 px-3 py-2.5 rounded-2xl bg-blue/8 border border-blue/20 flex items-center gap-2">
          <Moon size={14} className="text-blue shrink-0" />
          <p className="text-xs text-blue">
            {dayNames[today]} is a rest day in your plan. Pick a workout below if
            you want to train anyway.
          </p>
        </div>
      )}

      {/* Day selector — pick any workout */}
      <div className="flex gap-1 mb-6 overflow-x-auto no-scrollbar border-b border-border">
        {workoutDays.map((day, idx) => {
          const isSelected = selectedDayIdx === idx;
          const isScheduled = scheduledIdx === idx;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedId(day.id)}
              className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "text-text-primary"
                  : "text-text-subtle"
              }`}
            >
              {day.emoji} {day.name}
              {isScheduled && !isSelected && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-orange inline-block" />
              )}
              {isSelected && (
                <motion.div
                  layoutId="dayTab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-text-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {currentWorkout && workoutLog && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">
              {completedCount}/{totalExercises} exercises
            </span>
            <span className="text-xs font-medium text-text-primary flex items-center gap-1">
              <Flame size={12} className="text-orange" />
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
        </div>
      )}

      {/* Workout complete banner */}
      {workoutLog?.completedAt && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 bg-success/8 border border-success/20 rounded-2xl"
        >
          <p className="text-sm font-semibold text-success text-center">
            Workout Complete! Time for 30 min LISS cardio.
          </p>
        </motion.div>
      )}

      {/* No workouts configured at all */}
      {ready && workoutDays.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-muted mb-3">
            You have no workouts yet.
          </p>
          {onOpenPlan && (
            <button
              onClick={onOpenPlan}
              className="px-4 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold"
            >
              Build your plan
            </button>
          )}
        </div>
      )}

      {/* Workout with no exercises in it */}
      {currentWorkout && currentWorkout.exercises.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-muted mb-3">
            {currentWorkout.name} has no exercises yet.
          </p>
          {onOpenPlan && (
            <button
              onClick={onOpenPlan}
              className="px-4 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold"
            >
              Add exercises
            </button>
          )}
        </div>
      )}

      {/* Exercise cards */}
      {currentWorkout && workoutLog && (
        <div className="flex flex-col gap-3">
          {currentWorkout.exercises.map((exercise, idx) => {
            const exerciseLog = workoutLog.exercises[idx];
            const prevExerciseLog = previousLog?.exercises.find(
              (e) => e.exerciseId === exercise.id
            );
            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={idx}
                sets={exerciseLog?.sets || []}
                previousSets={prevExerciseLog?.sets}
                bestSet={bestSets[exercise.id] || null}
                onSetUpdate={(setIdx, field, value) =>
                  handleSetUpdate(idx, setIdx, field, value)
                }
                onSetToggle={(setIdx) => handleSetToggle(idx, setIdx)}
                onBestEdit={(weight, reps) => {
                  saveBestOverride(exercise.id, { weight, reps });
                  setBestSets((prev) => ({
                    ...prev,
                    [exercise.id]: { weight, reps, completed: true },
                  }));
                }}
                allSetsCompleted={exerciseLog?.completed || false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
