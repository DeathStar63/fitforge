"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, TrendingUp, Trophy } from "lucide-react";
import { Exercise, SetLog } from "@/lib/workouts";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  sets: SetLog[];
  previousSets?: SetLog[];
  bestSet: SetLog | null;
  onSetUpdate: (setIndex: number, field: "reps" | "weight", value: number) => void;
  onSetToggle: (setIndex: number) => void;
  allSetsCompleted: boolean;
}

const ExerciseCard = memo(function ExerciseCard({
  exercise,
  index,
  sets,
  previousSets,
  bestSet,
  onSetUpdate,
  onSetToggle,
  allSetsCompleted,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const shouldIncreaseWeight =
    previousSets &&
    previousSets.length > 0 &&
    previousSets.every(
      (s) => s.completed && s.reps >= exercise.targetRepsMax
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl overflow-hidden transition-colors ${
        allSetsCompleted
          ? "bg-success/5 border border-success/20"
          : "bg-bg-card border border-border shadow-[var(--shadow-card)]"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4"
      >
        {/* Exercise number / check */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            allSetsCompleted
              ? "bg-success text-white"
              : "bg-bg-surface text-text-muted"
          }`}
        >
          {allSetsCompleted ? <Check size={18} /> : index + 1}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {exercise.name}
          </p>
          <p className="text-xs text-text-subtle">{exercise.muscle}</p>
        </div>

        {/* Progress pills */}
        <div className="flex gap-1 mr-2">
          {sets.map((s, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                s.completed ? "bg-success" : "bg-border"
              }`}
            />
          ))}
        </div>

        {shouldIncreaseWeight && (
          <div className="shrink-0 mr-1">
            <TrendingUp size={16} className="text-orange" />
          </div>
        )}

        {expanded ? (
          <ChevronUp size={16} className="text-text-subtle shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-subtle shrink-0" />
        )}
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Exercise GIF */}
              {exercise.gifUrl && (
                <div className="mb-3 rounded-xl overflow-hidden bg-bg-surface">
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    width={320}
                    height={160}
                    className="w-full h-40 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              {/* Weight increase suggestion */}
              {shouldIncreaseWeight && (
                <div className="mb-3 px-3 py-2 bg-orange/8 rounded-xl border border-orange/15">
                  <p className="text-xs text-orange font-medium flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    You hit {exercise.targetRepsMax} reps on all sets last time — increase the weight!
                  </p>
                </div>
              )}

              {/* Personal Best */}
              {bestSet && bestSet.weight > 0 && (
                <div className="mb-3 px-3 py-2 bg-orange/5 rounded-xl border border-orange/10">
                  <p className="text-[10px] text-orange uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Trophy size={10} />
                    Personal Best
                  </p>
                  <span className="text-xs font-semibold text-orange">
                    {bestSet.weight}kg x {bestSet.reps}
                  </span>
                </div>
              )}

              {/* Previous performance */}
              {previousSets && previousSets.length > 0 && (
                <div className="mb-3 px-3 py-2 bg-bg-surface rounded-xl">
                  <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-1">
                    Last Session
                  </p>
                  <div className="flex gap-3">
                    {previousSets.map((ps, i) => (
                      <span key={i} className="text-xs text-text-muted">
                        {ps.weight}kg x {ps.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sets */}
              <div className="space-y-2">
                {sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`flex items-center gap-1.5 ${
                      set.completed ? "opacity-60" : ""
                    }`}
                  >
                    <span className="w-6 text-xs font-medium text-text-subtle text-center shrink-0">
                      {setIdx + 1}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight || ""}
                        onChange={(e) =>
                          onSetUpdate(setIdx, "weight", parseFloat(e.target.value) || 0)
                        }
                        placeholder="kg"
                        className="w-full text-center bg-bg-input rounded-lg py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps || ""}
                        onChange={(e) =>
                          onSetUpdate(setIdx, "reps", parseInt(e.target.value) || 0)
                        }
                        placeholder="reps"
                        className="w-full text-center bg-bg-input rounded-lg py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                      />
                    </div>
                    <button
                      onClick={() => onSetToggle(setIdx)}
                      className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                        set.completed
                          ? "bg-success text-white"
                          : "bg-bg-input text-text-subtle"
                      }`}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ExerciseCard;
