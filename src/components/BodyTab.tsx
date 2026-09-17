"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Play, Plus, RotateCcw, Target } from "lucide-react";
import BodyMap from "./BodyMap";
import QuickWorkoutSheet from "./QuickWorkoutSheet";
import {
  MUSCLE_GROUPS,
  MUSCLE_BY_ID,
  muscleLabel,
  type BodyView,
  type MuscleId,
} from "@/lib/muscles";
import {
  computeMuscleStatuses,
  suggestMuscles,
  musclesInRoutine,
  MUSCLE_STATE_COLORS,
  MUSCLE_STATE_LABELS,
  type MuscleState,
} from "@/lib/muscleStatus";
import { exercisesForMuscle } from "@/lib/exerciseLibrary";
import { getAllWorkoutLogs, type DayWorkoutLog } from "@/lib/storage";
import { usePlan } from "@/context/PlanContext";
import { getRoutineForDay, upsertQuickRoutine, QUICK_ROUTINE_ID } from "@/lib/plan";
import { dayNames } from "@/lib/workouts";

const STATE_ORDER: MuscleState[] = ["worked", "ready", "due"];

export default function BodyTab({
  onAddExercise,
  onStartWorkout,
}: {
  /** Opens the plan editor with this exercise queued to be added. */
  onAddExercise?: (exerciseId: string) => void;
  /** Jumps to the training screen with this workout open. */
  onStartWorkout?: (workoutId: string) => void;
}) {
  const { plan, updatePlan } = usePlan();
  const [view, setView] = useState<BodyView>("front");
  const [selected, setSelected] = useState<MuscleId[]>([]);
  const [logs, setLogs] = useState<Record<string, DayWorkoutLog>>({});
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    setLogs(getAllWorkoutLogs());
  }, []);

  const statuses = useMemo(() => computeMuscleStatuses(logs), [logs]);
  const suggestions = useMemo(() => suggestMuscles(statuses, 4), [statuses]);

  const today = new Date().getDay();
  const todaysRoutine = getRoutineForDay(plan, today);
  const todaysMuscles = useMemo(
    () =>
      todaysRoutine
        ? musclesInRoutine(todaysRoutine.exercises.map((e) => e.exerciseId))
        : [],
    [todaysRoutine]
  );

  // A muscle can only be selected from the view it appears on, so show how
  // many are selected on each side — otherwise a selection made on the back
  // is invisible while the front is showing.
  const countForView = (v: BodyView) =>
    selected.filter((m) => MUSCLE_BY_ID[m]?.views.includes(v)).length;

  const toggleMuscle = (m: MuscleId) =>
    setSelected((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  const selectedExercises = useMemo(() => {
    if (selected.length === 0) return [];
    const seen = new Set<string>();
    const out = [];
    for (const m of selected) {
      for (const ex of exercisesForMuscle(m)) {
        if (seen.has(ex.id)) continue;
        seen.add(ex.id);
        out.push(ex);
      }
    }
    return out.slice(0, 40);
  }, [selected]);

  /** Drop an exercise straight into today's routine (or the first routine). */
  const addToTodaysRoutine = (exerciseId: string) => {
    if (onAddExercise) {
      onAddExercise(exerciseId);
      return;
    }
    const targetId = todaysRoutine?.id ?? plan.routines[0]?.id;
    if (!targetId) return;
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.map((r) =>
        r.id === targetId && !r.exercises.some((e) => e.exerciseId === exerciseId)
          ? { ...r, exercises: [...r.exercises, { exerciseId }] }
          : r
      ),
    }));
  };

  const startQuickWorkout = (exerciseIds: string[]) => {
    updatePlan((prev) => upsertQuickRoutine(prev, exerciseIds, selected));
    setBuilderOpen(false);
    onStartWorkout?.(QUICK_ROUTINE_ID);
  };

  const counts = useMemo(() => {
    const c: Record<MuscleState, number> = { worked: 0, ready: 0, due: 0 };
    for (const g of MUSCLE_GROUPS) c[statuses[g.id].state] += 1;
    return c;
  }, [statuses]);

  return (
    <div className={selected.length > 0 ? "px-4 pt-2 pb-[10rem]" : "px-4 pt-2 pb-safe"}>
      <div className="mb-4">
        <h1 className="text-[28px] leading-tight font-bold text-text-primary tracking-[-0.02em]">
          Body Map
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Lime means recently trained, grey means it needs work. Tap a muscle
          to find exercises for it.
        </p>
      </div>

      {/* Front / back toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex rounded-2xl surface-sunken p-1">
          {(["front", "back"] as BodyView[]).map((v) => {
            const count = countForView(v);
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors flex items-center gap-1.5 ${
                  view === v
                    ? "grad-primary text-[#14151A] shadow-[var(--glow-primary)]"
                    : "text-text-subtle"
                }`}
              >
                {v}
                {count > 0 && (
                  <span
                    className={`px-1.5 rounded-full text-[10px] font-bold ${
                      view === v ? "grad-primary text-[#14151A] shadow-[var(--glow-primary)]" : "bg-accent/25 text-accent"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="flex items-center gap-1.5 text-xs text-text-muted px-3 py-1.5 rounded-lg bg-bg-surface"
          >
            <RotateCcw size={12} />
            Clear ({selected.length})
          </button>
        )}
      </div>

      {/* The figure */}
      <div className="surface rounded-3xl p-3 mb-4">
        <div className="h-[460px] mx-auto">
          <BodyMap
            view={view}
            statuses={statuses}
            selected={selected}
            highlighted={todaysMuscles}
            onToggleMuscle={toggleMuscle}
            showLabels
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          {STATE_ORDER.map((state) => (
            <div key={state} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: MUSCLE_STATE_COLORS[state] }}
              />
              <span className="text-[11px] text-text-muted">
                {MUSCLE_STATE_LABELS[state]} ({counts[state]})
              </span>
            </div>
          ))}
          {todaysMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-blue" />
              <span className="text-[11px] text-text-muted">Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">
          <Lightbulb size={14} className="text-orange" />
          What to hit next
        </h2>
        {suggestions.length === 0 ? (
          <div className="px-4 py-3 bg-success/8 border border-success/20 rounded-2xl">
            <p className="text-xs text-success">
              Everything has been trained recently — nothing is falling behind.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => {
              const status = statuses[s.muscle];
              return (
                <motion.button
                  key={s.muscle}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => toggleMuscle(s.muscle)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
                    selected.includes(s.muscle)
                      ? "surface ring-gradient"
                      : "surface"
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${MUSCLE_STATE_COLORS[status.state]}20`,
                    }}
                  >
                    <Target
                      size={15}
                      style={{ color: MUSCLE_STATE_COLORS[status.state] }}
                    />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">
                      {muscleLabel(s.muscle)}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {s.reason}
                    </span>
                  </span>
                  <span className="text-[11px] text-text-subtle shrink-0">
                    {status.weeklySets}/{status.weeklyTarget} sets
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* Per-muscle detail for the current selection */}
      {selected.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Selected
          </h2>
          <div className="flex flex-col gap-3 mb-4">
            {(["front", "back"] as BodyView[]).map((v) => {
              const inView = selected.filter((m) =>
                MUSCLE_BY_ID[m]?.views.includes(v)
              );
              if (inView.length === 0) return null;
              return (
                <div key={v}>
                  <p className="text-[10px] uppercase tracking-wider text-text-subtle mb-1.5 px-1">
                    {v}
                  </p>
                  <div className="flex flex-col gap-2">
                    {inView.map((m) => {
                      const st = statuses[m];
                      return (
                        <div
                          key={m}
                          className="flex items-center gap-3 px-3 py-2 surface rounded-2xl"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: MUSCLE_STATE_COLORS[st.state],
                            }}
                          />
                          <span className="text-sm font-medium text-text-primary flex-1">
                            {muscleLabel(m)}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {st.lastTrained
                              ? st.daysSince === 0
                                ? "Trained today"
                                : `${st.daysSince}d ago`
                              : "Never trained"}
                          </span>
                          <span className="text-[11px] text-text-subtle">
                            {st.weeklySets}/{st.weeklyTarget}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Exercises for {selected.map(muscleLabel).join(", ")}
          </h2>
          <div className="flex flex-col gap-2">
            {selectedExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 px-3 py-2.5 surface rounded-2xl"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-primary truncate">
                    {ex.name}
                  </span>
                  <span className="block text-[11px] text-text-subtle">
                    {ex.muscle}
                  </span>
                </span>
                <button
                  onClick={() => addToTodaysRoutine(ex.id)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl btn-primary text-[11px] font-semibold"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-subtle mt-2">
            Added to {todaysRoutine ? todaysRoutine.name : plan.routines[0]?.name}
            {todaysRoutine ? ` (${dayNames[today]}'s workout)` : ""}.
          </p>
        </section>
      )}

      {/* Sticky action bar — the selection is made at the top of a long
          screen, so the way to act on it has to follow you down. */}
      <AnimatePresence>
        {selected.length > 0 && !builderOpen && (
          <motion.div
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 max-w-md mx-auto"
          >
            <button
              onClick={() => setBuilderOpen(true)}
              className="w-full py-3.5 rounded-2xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Play size={15} />
              Start workout ·{" "}
              {selected.length === 1
                ? muscleLabel(selected[0])
                : `${selected.length} muscles`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {builderOpen && (
          <QuickWorkoutSheet
            muscles={selected}
            onStart={startQuickWorkout}
            onClose={() => setBuilderOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
