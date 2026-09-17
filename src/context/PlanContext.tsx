"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getPlan,
  savePlan as persistPlan,
  resetPlan as persistReset,
  defaultPlan,
  type WeekPlan,
} from "@/lib/plan";
import { getWorkoutDays, type WorkoutDay } from "@/lib/workouts";
import { SYNC_COMPLETE_EVENT } from "@/lib/sync";
import { useSync } from "./SyncContext";

interface PlanContextValue {
  plan: WeekPlan;
  /** True until the plan has been read out of localStorage on the client. */
  ready: boolean;
  updatePlan: (next: WeekPlan | ((prev: WeekPlan) => WeekPlan)) => void;
  resetPlan: () => void;
  /** The plan's routines resolved into full workout days. */
  workoutDays: WorkoutDay[];
}

/**
 * Plan edits fire on every keystroke (renaming a workout, nudging a set
 * count). localStorage can absorb that; a network round-trip per keystroke
 * cannot, so the cloud push is debounced.
 */
const SYNC_DEBOUNCE_MS = 1500;

const PlanContext = createContext<PlanContextValue>({
  plan: defaultPlan(),
  ready: false,
  updatePlan: () => {},
  resetPlan: () => {},
  workoutDays: [],
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { syncAfterSave } = useSync();
  const [plan, setPlan] = useState<WeekPlan>(defaultPlan);
  const [ready, setReady] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncTimer.current = null;
      syncAfterSave("plan");
    }, SYNC_DEBOUNCE_MS);
  }, [syncAfterSave]);

  useEffect(
    () => () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    },
    []
  );

  // localStorage is only available on the client, so hydrate after mount.
  useEffect(() => {
    setPlan(getPlan());
    setReady(true);
  }, []);

  // A cloud sync can replace the stored plan — pick the new one up.
  useEffect(() => {
    const onSynced = () => setPlan(getPlan());
    window.addEventListener(SYNC_COMPLETE_EVENT, onSynced);
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSynced);
  }, []);

  const updatePlan = useCallback(
    (next: WeekPlan | ((prev: WeekPlan) => WeekPlan)) => {
      setPlan((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        persistPlan(resolved);
        queueSync();
        return resolved;
      });
    },
    [queueSync]
  );

  const resetPlan = useCallback(() => {
    setPlan(persistReset());
    syncAfterSave("plan");
  }, [syncAfterSave]);

  const workoutDays = useMemo(() => getWorkoutDays(plan), [plan]);

  return (
    <PlanContext.Provider value={{ plan, ready, updatePlan, resetPlan, workoutDays }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
