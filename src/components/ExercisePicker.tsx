"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Dumbbell, Search, X } from "lucide-react";
import {
  searchExercises,
  EQUIPMENT_LABELS,
  GROUP_LABELS,
  type Equipment,
  type ExerciseGroup,
} from "@/lib/exerciseLibrary";
import { MUSCLE_GROUPS, type MuscleId } from "@/lib/muscles";

interface ExercisePickerProps {
  /** Ids already in the routine — shown as selected. */
  selectedIds: string[];
  onToggle: (exerciseId: string) => void;
  onClose: () => void;
  title?: string;
}

const GROUPS: ExerciseGroup[] = ["legs", "push", "pull", "core", "neck", "cardio"];
const EQUIPMENT: Equipment[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "band",
  "smith",
];

export default function ExercisePicker({
  selectedIds,
  onToggle,
  onClose,
  title = "Add exercises",
}: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ExerciseGroup | null>(null);
  const [muscles, setMuscles] = useState<MuscleId[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const results = useMemo(
    () => searchExercises({ query, group, muscles, equipment }),
    [query, group, muscles, equipment]
  );

  const selected = new Set(selectedIds);

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-bg-primary flex flex-col max-w-md mx-auto"
    >
      <div className="h-[env(safe-area-inset-top)]" />
      <header className="px-4 py-3 flex items-center gap-3 border-b border-border">
        <h2 className="flex-1 text-base font-bold text-text-primary">{title}</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-bg-surface flex items-center justify-center"
          aria-label="Close"
        >
          <X size={16} className="text-text-muted" />
        </button>
      </header>

      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl surface-sunken text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-violet/40"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup((prev) => (prev === g ? null : g))}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                group === g
                  ? "grad-primary text-[#14151A] shadow-[var(--glow-primary)]"
                  : "bg-bg-surface text-text-muted"
              }`}
            >
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {EQUIPMENT.map((e) => (
            <button
              key={e}
              onClick={() => setEquipment((prev) => toggleIn(prev, e))}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                equipment.includes(e)
                  ? "bg-blue/20 text-blue"
                  : "bg-bg-surface text-text-muted"
              }`}
            >
              {EQUIPMENT_LABELS[e]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMuscles((prev) => toggleIn(prev, m.id))}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                muscles.includes(m.id)
                  ? "bg-orange/20 text-orange"
                  : "bg-bg-surface text-text-muted"
              }`}
            >
              {m.short}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[11px] text-text-subtle mb-2">
          {results.length} exercise{results.length === 1 ? "" : "s"}
          {selectedIds.length > 0 && ` · ${selectedIds.length} in this workout`}
        </p>
        <div className="flex flex-col gap-2">
          {results.map((ex) => {
            const isSelected = selected.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => onToggle(ex.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-colors ${
                  isSelected
                    ? "bg-success/10 border-success/35"
                    : "surface"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-success text-white" : "bg-bg-surface"
                  }`}
                >
                  {isSelected ? (
                    <Check size={14} />
                  ) : (
                    <Dumbbell size={13} className="text-text-subtle" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-primary truncate">
                    {ex.name}
                  </span>
                  <span className="block text-[11px] text-text-subtle truncate">
                    {ex.muscle} · {EQUIPMENT_LABELS[ex.equipment]}
                  </span>
                </span>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="text-sm text-text-subtle text-center py-10">
              Nothing matches those filters.
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl btn-primary text-sm font-semibold"
        >
          Done
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </motion.div>
  );
}
