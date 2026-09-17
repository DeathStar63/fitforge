"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Play, Plus, RefreshCw, X } from "lucide-react";
import {
  buildSessionForMuscles,
  exercisesForMuscle,
  getLibraryExercise,
  EQUIPMENT_LABELS,
} from "@/lib/exerciseLibrary";
import { muscleLabel, type MuscleId } from "@/lib/muscles";

interface QuickWorkoutSheetProps {
  muscles: MuscleId[];
  onStart: (exerciseIds: string[]) => void;
  onClose: () => void;
}

export default function QuickWorkoutSheet({
  muscles,
  onStart,
  onClose,
}: QuickWorkoutSheetProps) {
  const suggested = useMemo(() => buildSessionForMuscles(muscles), [muscles]);
  const [picked, setPicked] = useState<string[]>(suggested);
  const [showAll, setShowAll] = useState(false);

  // Everything else that trains the selected muscles, for swapping things in.
  const alternatives = useMemo(() => {
    const seen = new Set(picked);
    const out: string[] = [];
    for (const m of muscles) {
      for (const ex of exercisesForMuscle(m)) {
        if (seen.has(ex.id)) continue;
        seen.add(ex.id);
        out.push(ex.id);
      }
    }
    return out;
  }, [muscles, picked]);

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const totalSets = picked.reduce(
    (n, id) => n + (getLibraryExercise(id)?.defaultSets ?? 3),
    0
  );

  const row = (id: string, selected: boolean) => {
    const ex = getLibraryExercise(id);
    if (!ex) return null;
    return (
      <button
        key={id}
        onClick={() => toggle(id)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-colors ${
          selected
            ? "bg-success/8 border-success/30"
            : "bg-bg-card border-border"
        }`}
      >
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            selected ? "bg-success text-white" : "bg-bg-surface"
          }`}
        >
          {selected ? <Check size={14} /> : <Plus size={13} className="text-text-subtle" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-text-primary truncate">
            {ex.name}
          </span>
          <span className="block text-[11px] text-text-subtle truncate">
            {ex.muscle} · {EQUIPMENT_LABELS[ex.equipment]}
          </span>
        </span>
        <span className="text-[11px] text-text-subtle shrink-0">
          {ex.defaultSets} x {ex.defaultRepsMin}-{ex.defaultRepsMax}
        </span>
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-bg-primary flex flex-col max-w-md mx-auto"
    >
      <div className="h-[env(safe-area-inset-top)]" />
      <header className="px-4 py-3 flex items-center gap-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-text-primary">Quick Session</h2>
          <p className="text-[11px] text-text-subtle truncate">
            {muscles.map(muscleLabel).join(", ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center"
          aria-label="Close"
        >
          <X size={16} className="text-text-muted" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-text-subtle">
            {picked.length} exercise{picked.length === 1 ? "" : "s"} · {totalSets} sets
          </p>
          <button
            onClick={() => setPicked(suggested)}
            className="flex items-center gap-1 text-[11px] text-text-muted px-2.5 py-1 rounded-lg bg-bg-surface"
          >
            <RefreshCw size={11} />
            Reset
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {suggested.map((id) => row(id, picked.includes(id)))}
          {/* Anything added from the full list that was not in the suggestion */}
          {picked.filter((id) => !suggested.includes(id)).map((id) => row(id, true))}
        </div>

        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full mt-4 py-2.5 rounded-xl bg-bg-surface text-xs font-medium text-text-muted"
        >
          {showAll ? "Hide" : `Swap in something else (${alternatives.length})`}
        </button>

        {showAll && (
          <div className="flex flex-col gap-2 mt-2">
            {alternatives.map((id) => row(id, false))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <button
          disabled={picked.length === 0}
          onClick={() => onStart(picked)}
          className="w-full py-3 rounded-xl bg-accent text-bg-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Play size={15} />
          Start workout
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </motion.div>
  );
}
