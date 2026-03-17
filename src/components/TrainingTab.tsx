"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Flame, Moon } from "lucide-react";
import ExerciseCard from "./ExerciseCard";
import {
  workoutDays,
  getTodaysWorkout,
  dayNames,
  WorkoutDay,
} from "@/lib/workouts";
import {
  getWorkoutLog,
  saveWorkoutLog,
  getLastWorkoutLog,
  initExerciseLog,
  getDateKey,
  DayWorkoutLog,
} from "@/lib/storage";
import { useSync } from "@/context/SyncContext";
import type { ExerciseLog } from "@/lib/workouts";

export default function TrainingTab() {
  const { syncAfterSave } = useSync();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [workoutLog, setWorkoutLog] = useState<DayWorkoutLog | null>(null);
  const [previousLog, setPreviousLog] = useState<DayWorkoutLog | null>(null);
  const today = new Date().getDay();

  const currentWorkout: WorkoutDay | null =
    selectedDayIdx !== null
      ? workoutDays[selectedDayIdx]
      : getTodaysWorkout();

  // Determine which workout day tab index maps to today
  const todayWorkoutIdx = workoutDays.findIndex((w) =>
    w.dayNumbers.includes(today)
  );

  useEffect(() => {
    if (selectedDayIdx === null && todayWorkoutIdx >= 0) {
      setSelectedDayIdx(todayWorkoutIdx);
    } else if (selectedDayIdx === null) {
      setSelectedDayIdx(0);
    }
  }, [selectedDayIdx, todayWorkoutIdx]);

  // Load workout log
  useEffect(() => {
    if (!currentWorkout) return;
    const dateKey = getDateKey();
    const existing = getWorkoutLog(dateKey);
    if (existing && existing.workoutId === currentWorkout.id) {
      setWorkoutLog(existing);
    } else {
      const newLog: DayWorkoutLog = {
        date: dateKey,
        workoutId: currentWorkout.id,
        exercises: currentWorkout.exercises.map((ex) =>
          initExerciseLog(ex.id, ex.sets)
        ),
      };
      setWorkoutLog(newLog);
    }
    // Get previous session for same workout type
    const prev = getLastWorkoutLog(currentWorkout.id);
    setPreviousLog(prev);
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
        updated.exercises[exerciseIdx].sets[setIdx] = {
          ...updated.exercises[exerciseIdx].sets[setIdx],
          [field]: value,
        };
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
  const isRestDay = today === 0;

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {isRestDay ? "Rest Day" : "Today's Workout"}
        </h1>
        <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {dayNames[today]}
          {currentWorkout && (
            <>
              <span className="text-text-subtle mx-1">|</span>
              <Clock size={14} />
              90 min + 30 min cardio
            </>
          )}
        </p>
      </div>

      {/* Rest day card */}
      {isRestDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bg-card rounded-2xl border border-border p-6 text-center shadow-[var(--shadow-card)]"
        >
          <Moon size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Active Recovery</h2>
          <p className="text-sm text-text-muted">
            Rest from the gym today. Light walking, stretching, and let your
            body rebuild from 12 hours of weekly training.
          </p>
        </motion.div>
      )}

      {/* Day selector — underline style like reference */}
      {!isRestDay && (
        <div className="flex gap-1 mb-6 overflow-x-auto no-scrollbar border-b border-border">
          {workoutDays.map((day, idx) => {
            const isSelected = selectedDayIdx === idx;
            const isToday = day.dayNumbers.includes(today);
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? "text-text-primary"
                    : "text-text-subtle"
                }`}
              >
                {day.emoji} {day.name}
                {isToday && !isSelected && (
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
      )}

      {/* Progress bar */}
      {currentWorkout && workoutLog && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">
              {completedCount}/{totalExercises} exercises
            </span>
            <span className="text-xs font-medium text-text-primary flex items-center gap-1">
              <Flame size={12} className="text-orange" />
              {Math.round((completedCount / totalExercises) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(completedCount / totalExercises) * 100}%`,
              }}
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
                onSetUpdate={(setIdx, field, value) =>
                  handleSetUpdate(idx, setIdx, field, value)
                }
                onSetToggle={(setIdx) => handleSetToggle(idx, setIdx)}
                allSetsCompleted={exerciseLog?.completed || false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
