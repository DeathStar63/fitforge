"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import ExercisePicker from "./ExercisePicker";
import BodyMap from "./BodyMap";
import { usePlan } from "@/context/PlanContext";
import { dayNames, dayShortNames } from "@/lib/workouts";
import {
  getCustomGifs,
  setCustomGif,
  newRoutineId,
  type Routine,
} from "@/lib/plan";
import { getLibraryExercise } from "@/lib/exerciseLibrary";
import { musclesInRoutine } from "@/lib/muscleStatus";
import { muscleLabel } from "@/lib/muscles";

const EMOJI_CHOICES = ["🦵", "💪", "🏋️", "🔥", "⚡", "🧘", "🏃", "🤸", "🥊", "🚴"];

export default function PlanEditor({
  onClose,
  pendingExerciseId,
}: {
  onClose: () => void;
  /** An exercise queued from elsewhere (e.g. the body map). */
  pendingExerciseId?: string | null;
}) {
  const { plan, updatePlan, resetPlan } = usePlan();
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [gifEditId, setGifEditId] = useState<string | null>(null);
  const [gifDraft, setGifDraft] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const editing = plan.routines.find((r) => r.id === editingRoutineId) ?? null;
  // The editor only mounts on a tap, never during SSR, so reading
  // localStorage in the initialiser is safe here.
  const [customGifs, setCustomGifs] = useState<Record<string, string>>(() =>
    typeof window === "undefined" ? {} : getCustomGifs()
  );

  // ---- day assignment -----------------------------------------------------
  const assignDay = (day: number, routineId: string | null) =>
    updatePlan((prev) => {
      const days = [...prev.days];
      days[day] = routineId;
      return { ...prev, days };
    });

  // ---- routine CRUD -------------------------------------------------------
  const addRoutine = () =>
    updatePlan((prev) => {
      const id = newRoutineId(prev);
      const routine: Routine = {
        id,
        name: `Workout ${prev.routines.length + 1}`,
        subtitle: "Custom routine",
        emoji: "🔥",
        exercises: [],
      };
      setEditingRoutineId(id);
      return { ...prev, routines: [...prev.routines, routine] };
    });

  const patchRoutine = (id: string, patch: Partial<Routine>) =>
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const deleteRoutine = (id: string) =>
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id),
      days: prev.days.map((d) => (d === id ? null : d)),
    }));

  // ---- exercises within a routine ----------------------------------------
  const toggleExercise = (routineId: string, exerciseId: string) =>
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => {
        if (r.id !== routineId) return r;
        const has = r.exercises.some((e) => e.exerciseId === exerciseId);
        return {
          ...r,
          exercises: has
            ? r.exercises.filter((e) => e.exerciseId !== exerciseId)
            : [...r.exercises, { exerciseId }],
        };
      }),
    }));

  const moveExercise = (routineId: string, index: number, delta: number) =>
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.map((r) => {
        if (r.id !== routineId) return r;
        const next = [...r.exercises];
        const target = index + delta;
        if (target < 0 || target >= next.length) return r;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...r, exercises: next };
      }),
    }));

  const patchExercise = (
    routineId: string,
    exerciseId: string,
    patch: { sets?: number; repsMin?: number; repsMax?: number }
  ) =>
    updatePlan((prev) => ({
      ...prev,
      routines: prev.routines.map((r) =>
        r.id !== routineId
          ? r
          : {
              ...r,
              exercises: r.exercises.map((e) =>
                e.exerciseId === exerciseId ? { ...e, ...patch } : e
              ),
            }
      ),
    }));

  // An exercise sent over from the body map lands in the routine being edited.
  const queued = pendingExerciseId ? getLibraryExercise(pendingExerciseId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-bg-primary overflow-y-auto max-w-md mx-auto"
    >
      <div className="h-[env(safe-area-inset-top)]" />
      <header className="px-4 py-3 flex items-center gap-3 border-b border-border sticky top-0 bg-bg-primary/95 backdrop-blur-xl z-10">
        <div className="flex-1">
          <h1 className="text-base font-bold text-text-primary">Your Plan</h1>
          <p className="text-[11px] text-text-subtle">
            Choose what you train on each day
          </p>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center"
          aria-label="Reset plan"
        >
          <RotateCcw size={15} className="text-text-muted" />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center"
          aria-label="Close"
        >
          <X size={16} className="text-text-muted" />
        </button>
      </header>

      <div className="px-4 py-4 pb-24">
        {queued && (
          <div className="mb-4 px-3 py-2.5 rounded-2xl bg-blue/8 border border-blue/20">
            <p className="text-xs text-blue">
              Pick a workout below and add <strong>{queued.name}</strong> to it.
            </p>
          </div>
        )}

        {/* ---------------- Weekly schedule ---------------- */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Weekly schedule
          </h2>
          <div className="flex flex-col gap-2">
            {dayNames.map((name, day) => {
              const assigned = plan.days[day];
              return (
                <div
                  key={name}
                  className="surface rounded-2xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-9 text-xs font-semibold text-text-primary">
                      {dayShortNames[day]}
                    </span>
                    <span className="text-[11px] text-text-subtle flex-1">
                      {assigned
                        ? plan.routines.find((r) => r.id === assigned)?.name
                        : "Rest day"}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => assignDay(day, null)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                        assigned === null
                          ? "grad-primary text-[#0B0B14] shadow-[var(--glow-primary)]"
                          : "bg-bg-surface text-text-muted"
                      }`}
                    >
                      Rest
                    </button>
                    {plan.routines.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => assignDay(day, r.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          assigned === r.id
                            ? "grad-primary text-[#0B0B14] shadow-[var(--glow-primary)]"
                            : "bg-bg-surface text-text-muted"
                        }`}
                      >
                        {r.emoji} {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------- Routines ---------------- */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-primary">Workouts</h2>
            <button
              onClick={addRoutine}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg btn-primary text-[11px] font-semibold"
            >
              <Plus size={12} />
              New
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {plan.routines.map((routine) => {
              const muscles = musclesInRoutine(
                routine.exercises.map((e) => e.exerciseId)
              );
              const scheduled = plan.days
                .map((d, i) => (d === routine.id ? dayShortNames[i] : null))
                .filter(Boolean);
              return (
                <div
                  key={routine.id}
                  className="surface rounded-2xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-lg shrink-0">
                      {routine.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {routine.name}
                      </p>
                      <p className="text-[11px] text-text-subtle truncate">
                        {routine.exercises.length} exercises
                        {scheduled.length > 0 && ` · ${scheduled.join(", ")}`}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setEditingRoutineId(
                          editingRoutineId === routine.id ? null : routine.id
                        )
                      }
                      className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center shrink-0"
                      aria-label={`Edit ${routine.name}`}
                    >
                      <Pencil size={14} className="text-text-muted" />
                    </button>
                  </div>

                  {muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {muscles.slice(0, 6).map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md bg-bg-surface text-[10px] text-text-muted"
                        >
                          {muscleLabel(m)}
                        </span>
                      ))}
                      {muscles.length > 6 && (
                        <span className="px-2 py-0.5 text-[10px] text-text-subtle">
                          +{muscles.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ---------------- Routine detail sheet ---------------- */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-bg-primary overflow-y-auto max-w-md mx-auto"
          >
            <div className="h-[env(safe-area-inset-top)]" />
            <header className="px-4 py-3 flex items-center gap-3 border-b border-border sticky top-0 bg-bg-primary/95 backdrop-blur-xl z-10">
              <h2 className="flex-1 text-base font-bold text-text-primary truncate">
                {editing.name}
              </h2>
              <button
                onClick={() => setEditingRoutineId(null)}
                className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center"
                aria-label="Close"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </header>

            <div className="px-4 py-4 pb-28">
              {/* Name + emoji */}
              <div className="flex gap-2 mb-3">
                <input
                  value={editing.name}
                  onChange={(e) =>
                    patchRoutine(editing.id, { name: e.target.value })
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl surface-sunken text-sm text-text-primary outline-none focus:ring-2 focus:ring-violet/40"
                  placeholder="Workout name"
                />
              </div>
              <input
                value={editing.subtitle}
                onChange={(e) =>
                  patchRoutine(editing.id, { subtitle: e.target.value })
                }
                className="w-full px-3 py-2.5 mb-3 rounded-xl surface-sunken text-sm text-text-primary outline-none focus:ring-2 focus:ring-violet/40"
                placeholder="Description, e.g. Chest, Shoulders, Triceps"
              />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => patchRoutine(editing.id, { emoji: e })}
                    className={`shrink-0 w-9 h-9 rounded-xl text-base flex items-center justify-center ${
                      editing.emoji === e ? "bg-accent/20 ring-1 ring-accent/40" : "bg-bg-surface"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Muscles this workout covers */}
              <div className="surface rounded-2xl p-3 mb-4">
                <p className="text-[11px] text-text-muted mb-2">
                  Muscles this workout hits
                </p>
                <div className="flex gap-3">
                  {(["front", "back"] as const).map((v) => (
                    <div key={v} className="flex-1 h-36">
                      <BodyMap
                        view={v}
                        highlighted={musclesInRoutine(
                          editing.exercises.map((e) => e.exerciseId)
                        )}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercise list */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Exercises ({editing.exercises.length})
                </h3>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg btn-primary text-[11px] font-semibold"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              {queued && !editing.exercises.some((e) => e.exerciseId === queued.id) && (
                <button
                  onClick={() => toggleExercise(editing.id, queued.id)}
                  className="w-full mb-2 px-3 py-2.5 rounded-2xl bg-blue/10 border border-blue/25 text-xs text-blue font-medium text-left"
                >
                  + Add {queued.name} to this workout
                </button>
              )}

              <div className="flex flex-col gap-2">
                {editing.exercises.map((ref, idx) => {
                  const lib = getLibraryExercise(ref.exerciseId);
                  if (!lib) return null;
                  const sets = ref.sets ?? lib.defaultSets;
                  const repsMin = ref.repsMin ?? lib.defaultRepsMin;
                  const repsMax = ref.repsMax ?? lib.defaultRepsMax;
                  const hasGif = Boolean(customGifs[lib.id] || lib.gifUrl);
                  return (
                    <div
                      key={ref.exerciseId}
                      className="surface rounded-2xl p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-text-primary truncate">
                            {lib.name}
                          </span>
                          <span className="block text-[11px] text-text-subtle truncate">
                            {lib.muscle}
                          </span>
                        </span>
                        <button
                          onClick={() => moveExercise(editing.id, idx, -1)}
                          disabled={idx === 0}
                          className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp size={13} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => moveExercise(editing.id, idx, 1)}
                          disabled={idx === editing.exercises.length - 1}
                          className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown size={13} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => toggleExercise(editing.id, ref.exerciseId)}
                          className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center"
                          aria-label="Remove"
                        >
                          <Trash2 size={13} className="text-error" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-text-subtle">
                          Sets
                          <input
                            type="number"
                            inputMode="numeric"
                            value={sets}
                            min={1}
                            max={10}
                            onChange={(e) =>
                              patchExercise(editing.id, ref.exerciseId, {
                                sets: Math.max(
                                  1,
                                  Math.min(10, parseInt(e.target.value) || 1)
                                ),
                              })
                            }
                            className="w-12 text-center py-1 rounded-lg surface-sunken text-xs text-text-primary outline-none"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-text-subtle">
                          Reps
                          <input
                            type="number"
                            inputMode="numeric"
                            value={repsMin}
                            onChange={(e) =>
                              patchExercise(editing.id, ref.exerciseId, {
                                repsMin: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-12 text-center py-1 rounded-lg surface-sunken text-xs text-text-primary outline-none"
                          />
                          –
                          <input
                            type="number"
                            inputMode="numeric"
                            value={repsMax}
                            onChange={(e) =>
                              patchExercise(editing.id, ref.exerciseId, {
                                repsMax: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-12 text-center py-1 rounded-lg surface-sunken text-xs text-text-primary outline-none"
                          />
                        </label>
                        <button
                          onClick={() => {
                            setGifEditId(lib.id);
                            setGifDraft(customGifs[lib.id] || "");
                          }}
                          className={`ml-auto w-8 h-8 rounded-lg flex items-center justify-center ${
                            hasGif ? "bg-success/10" : "bg-bg-surface"
                          }`}
                          aria-label="Set GIF"
                          title={hasGif ? "Change animation" : "Add an animation URL"}
                        >
                          <ImageIcon
                            size={13}
                            className={hasGif ? "text-success" : "text-text-subtle"}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {editing.exercises.length === 0 && (
                  <p className="text-sm text-text-subtle text-center py-8">
                    No exercises yet — tap Add.
                  </p>
                )}
              </div>

              {!editing.builtIn && (
                <button
                  onClick={() => {
                    deleteRoutine(editing.id);
                    setEditingRoutineId(null);
                  }}
                  className="w-full mt-5 py-3 rounded-xl bg-error/10 text-error text-sm font-semibold"
                >
                  Delete this workout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Exercise picker ---------------- */}
      <AnimatePresence>
        {pickerOpen && editing && (
          <ExercisePicker
            title={`Add to ${editing.name}`}
            selectedIds={editing.exercises.map((e) => e.exerciseId)}
            onToggle={(id) => toggleExercise(editing.id, id)}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ---------------- Custom GIF dialog ---------------- */}
      <AnimatePresence>
        {gifEditId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 flex items-end sm:items-center justify-center p-4"
            onClick={() => setGifEditId(null)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm surface rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-text-primary mb-1">
                Exercise animation
              </p>
              <p className="text-[11px] text-text-muted mb-3">
                Paste a direct link to a GIF or image. Leave it empty to fall back
                to the built-in one.
              </p>
              <input
                value={gifDraft}
                onChange={(e) => setGifDraft(e.target.value)}
                placeholder="https://…/exercise.gif"
                className="w-full px-3 py-2.5 rounded-xl surface-sunken text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-violet/40"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setGifEditId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-bg-surface text-text-muted text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const url = gifDraft.trim();
                    setCustomGif(gifEditId, url || null);
                    setCustomGifs(getCustomGifs());
                    setGifEditId(null);
                    // Re-render the plan so resolved GIF URLs refresh.
                    updatePlan((prev) => ({ ...prev }));
                  }}
                  className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Reset confirmation ---------------- */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm surface rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-text-primary mb-1">
                Reset your plan?
              </p>
              <p className="text-[11px] text-text-muted mb-3">
                This restores the default Legs / Push / Pull split and discards
                any workouts you have built. Your logged history is not touched.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 rounded-xl bg-bg-surface text-text-muted text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetPlan();
                    setConfirmReset(false);
                    setEditingRoutineId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-error text-white text-sm font-semibold"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
