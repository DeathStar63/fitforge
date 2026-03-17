"use client";

import { createContext, useContext, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { fullSync, pushDataType, getLastSyncTime, SyncDataType } from "@/lib/sync";
import { supabase } from "@/lib/supabase";

interface SyncContextType {
  /** Push a specific data type to Supabase after a local save */
  syncAfterSave: (dataType: SyncDataType) => void;
  /** Trigger a full sync manually */
  triggerFullSync: () => Promise<void>;
  /** Last sync timestamp */
  lastSync: string | null;
}

const SyncContext = createContext<SyncContextType>({
  syncAfterSave: () => {},
  triggerFullSync: async () => {},
  lastSync: null,
});

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const syncInProgress = useRef(false);

  const triggerFullSync = useCallback(async () => {
    if (!user || !supabase || syncInProgress.current) return;
    syncInProgress.current = true;
    try {
      await fullSync(user.id);
    } finally {
      syncInProgress.current = false;
    }
  }, [user]);

  const syncAfterSave = useCallback(
    (dataType: SyncDataType) => {
      if (!user) return;
      pushDataType(user.id, dataType);
    },
    [user]
  );

  // Sync on login (user becomes non-null)
  useEffect(() => {
    if (user && supabase) {
      triggerFullSync();
    }
  }, [user, triggerFullSync]);

  // Periodic sync every 5 minutes while logged in
  useEffect(() => {
    if (!user || !supabase) return;

    const interval = setInterval(() => {
      triggerFullSync();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, triggerFullSync]);

  // Sync when the tab regains focus (user returns to app)
  useEffect(() => {
    if (!user || !supabase) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerFullSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, triggerFullSync]);

  return (
    <SyncContext.Provider
      value={{
        syncAfterSave,
        triggerFullSync,
        lastSync: typeof window !== "undefined" ? getLastSyncTime() : null,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
