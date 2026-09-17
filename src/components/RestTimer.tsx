"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, Timer, X } from "lucide-react";

const REST_PREF_KEY = "fitforge_rest_seconds";
const DEFAULT_REST = 90;
const MIN_REST = 15;
const MAX_REST = 600;

function readPref(): number {
  if (typeof window === "undefined") return DEFAULT_REST;
  const raw = Number(localStorage.getItem(REST_PREF_KEY));
  return Number.isFinite(raw) && raw >= MIN_REST && raw <= MAX_REST
    ? raw
    : DEFAULT_REST;
}

function mmss(total: number): string {
  const s = Math.max(0, total);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Rest countdown between sets.
 *
 * `runKey` is a counter the training screen bumps every time a set is newly
 * completed; a change restarts the clock. Driving it that way keeps the timer
 * stateless from the caller's point of view — it does not need to know when a
 * rest is already running.
 */
export default function RestTimer({
  runKey,
  onVisibilityChange,
}: {
  runKey: number;
  onVisibilityChange?: (visible: boolean) => void;
}) {
  // readPref() guards for SSR, and the timer renders nothing until it is
  // running, so seeding from localStorage cannot cause a hydration mismatch.
  const [duration, setDuration] = useState(readPref);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endsAt = useRef<number>(0);

  const stop = useCallback(() => {
    setRunning(false);
    setDone(false);
    setRemaining(0);
  }, []);

  // A new completed set restarts the rest. This is the "adjust state when a
  // prop changes" pattern rather than an effect: reacting in an effect would
  // render the old remaining time for a frame before correcting it.
  const [lastKey, setLastKey] = useState(runKey);
  if (runKey !== lastKey) {
    setLastKey(runKey);
    const secs = readPref();
    setDuration(secs);
    endsAt.current = Date.now() + secs * 1000;
    setRemaining(secs);
    setDone(false);
    setRunning(true);
  }

  // Tick off wall-clock rather than counting intervals, so backgrounding the
  // tab does not leave the timer behind.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.round((endsAt.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        setDone(true);
        navigator.vibrate?.(200);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);

  // Clear the "done" state a few seconds after it lands.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(stop, 4000);
    return () => clearTimeout(id);
  }, [done, stop]);

  const visible = running || done;
  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  const adjust = (delta: number) => {
    const next = Math.min(MAX_REST, Math.max(MIN_REST, duration + delta));
    setDuration(next);
    localStorage.setItem(REST_PREF_KEY, String(next));
    if (running) {
      endsAt.current += delta * 1000;
      setRemaining(Math.max(0, Math.round((endsAt.current - Date.now()) / 1000)));
    }
  };

  const progress = duration > 0 ? 1 - remaining / duration : 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 70, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 max-w-md mx-auto"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border shadow-[var(--shadow-card-lg)] ${
              done
                ? "bg-success/12 border-success/30"
                : "bg-bg-card border-border"
            }`}
          >
            {/* Progress fill */}
            {!done && (
              <motion.div
                className="absolute inset-y-0 left-0 bg-accent/10"
                animate={{ width: `${progress * 100}%` }}
                transition={{ ease: "linear", duration: 0.25 }}
              />
            )}

            <div className="relative flex items-center gap-2 px-3 py-2.5">
              {done ? (
                <>
                  <Check size={16} className="text-success shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-success">
                    Rest done — next set
                  </span>
                </>
              ) : (
                <>
                  <Timer size={15} className="text-text-muted shrink-0" />
                  <span className="text-lg font-bold text-text-primary tabular-nums w-14">
                    {mmss(remaining)}
                  </span>
                  <span className="flex-1 text-[11px] text-text-subtle">
                    rest · {duration}s
                  </span>
                  <button
                    onClick={() => adjust(-15)}
                    className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center"
                    aria-label="15 seconds less"
                  >
                    <Minus size={14} className="text-text-muted" />
                  </button>
                  <button
                    onClick={() => adjust(15)}
                    className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center"
                    aria-label="15 seconds more"
                  >
                    <Plus size={14} className="text-text-muted" />
                  </button>
                </>
              )}
              <button
                onClick={stop}
                className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center shrink-0"
                aria-label="Dismiss rest timer"
              >
                <X size={14} className="text-text-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
