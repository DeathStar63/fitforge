/*
 * Supabase Cloud Sync for FitForge
 *
 * SQL to create the table in Supabase:
 * ----------------------------------------
 * CREATE TABLE user_data (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   data_type TEXT NOT NULL CHECK (data_type IN ('workout_logs', 'body_stats', 'inbody_reports')),
 *   data JSONB NOT NULL DEFAULT '{}',
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   UNIQUE(user_id, data_type)
 * );
 *
 * -- Enable RLS
 * ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
 *
 * -- Users can only access their own data
 * CREATE POLICY "Users can read own data" ON user_data
 *   FOR SELECT USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own data" ON user_data
 *   FOR INSERT WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own data" ON user_data
 *   FOR UPDATE USING (auth.uid() = user_id);
 * ----------------------------------------
 */

import { supabase } from "./supabase";

export type SyncDataType = "workout_logs" | "body_stats" | "inbody_reports";

const STORAGE_KEYS: Record<SyncDataType, string> = {
  workout_logs: "fitforge_workout_logs",
  body_stats: "fitforge_body_stats",
  inbody_reports: "fitforge_inbody_reports",
};

const LAST_SYNC_KEY = "fitforge_last_sync";

/**
 * Push local data to Supabase for a given data type.
 * Uses upsert so it works for both first sync and updates.
 */
export async function syncToSupabase(
  userId: string,
  dataType: SyncDataType,
  data: unknown
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase not configured" };

  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      data_type: dataType,
      data: data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,data_type" }
  );

  if (error) {
    console.error(`[Sync] Failed to push ${dataType}:`, error.message);
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Pull data from Supabase for a given data type.
 * Returns null if no data exists remotely.
 */
export async function syncFromSupabase(
  userId: string,
  dataType: SyncDataType
): Promise<{ data: unknown | null; updatedAt: string | null; error: string | null }> {
  if (!supabase) return { data: null, updatedAt: null, error: "Supabase not configured" };

  const { data, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .eq("data_type", dataType)
    .single();

  if (error) {
    // PGRST116 = no rows found, which is fine for first-time users
    if (error.code === "PGRST116") {
      return { data: null, updatedAt: null, error: null };
    }
    console.error(`[Sync] Failed to pull ${dataType}:`, error.message);
    return { data: null, updatedAt: null, error: error.message };
  }

  return { data: data.data, updatedAt: data.updated_at, error: null };
}

/**
 * Get the raw localStorage value for a data type.
 */
function getLocalData(dataType: SyncDataType): unknown {
  const raw = localStorage.getItem(STORAGE_KEYS[dataType]);
  if (!raw) return dataType === "workout_logs" ? {} : [];
  try {
    return JSON.parse(raw);
  } catch {
    return dataType === "workout_logs" ? {} : [];
  }
}

/**
 * Write data to localStorage for a data type.
 */
function setLocalData(dataType: SyncDataType, data: unknown): void {
  localStorage.setItem(STORAGE_KEYS[dataType], JSON.stringify(data));
}

/**
 * Merge remote data into local data.
 * Strategy:
 *   - workout_logs: object keyed by date — merge keys, remote wins on conflict
 *   - body_stats: array of entries — merge by date, remote wins on conflict
 *   - inbody_reports: array of entries — merge by id, remote wins on conflict
 */
function mergeData(dataType: SyncDataType, local: unknown, remote: unknown): unknown {
  if (dataType === "workout_logs") {
    const localObj = (local as Record<string, unknown>) || {};
    const remoteObj = (remote as Record<string, unknown>) || {};
    // Spread local first, then remote overwrites conflicts
    return { ...localObj, ...remoteObj };
  }

  if (dataType === "body_stats") {
    const localArr = Array.isArray(local) ? local : [];
    const remoteArr = Array.isArray(remote) ? remote : [];
    const map = new Map<string, unknown>();
    for (const item of localArr) {
      map.set((item as { date: string }).date, item);
    }
    for (const item of remoteArr) {
      // Remote wins on conflict
      map.set((item as { date: string }).date, item);
    }
    return Array.from(map.values()).sort((a, b) =>
      ((a as { date: string }).date).localeCompare((b as { date: string }).date)
    );
  }

  if (dataType === "inbody_reports") {
    const localArr = Array.isArray(local) ? local : [];
    const remoteArr = Array.isArray(remote) ? remote : [];
    const map = new Map<string, unknown>();
    for (const item of localArr) {
      map.set((item as { id: string }).id, item);
    }
    for (const item of remoteArr) {
      map.set((item as { id: string }).id, item);
    }
    return Array.from(map.values()).sort((a, b) =>
      ((b as { date: string }).date).localeCompare((a as { date: string }).date)
    );
  }

  return remote ?? local;
}

/**
 * Full sync: pull from Supabase, merge with local, push merged result back.
 * Called on login and periodically.
 */
export async function fullSync(userId: string): Promise<void> {
  if (!supabase) return;

  const dataTypes: SyncDataType[] = ["workout_logs", "body_stats", "inbody_reports"];

  for (const dataType of dataTypes) {
    try {
      const localData = getLocalData(dataType);
      const { data: remoteData, error } = await syncFromSupabase(userId, dataType);

      if (error) {
        console.warn(`[Sync] Skipping ${dataType} due to error:`, error);
        continue;
      }

      if (remoteData !== null) {
        // Merge remote into local
        const merged = mergeData(dataType, localData, remoteData);
        setLocalData(dataType, merged);
        // Push merged result back
        await syncToSupabase(userId, dataType, merged);
      } else {
        // No remote data yet — push local up
        await syncToSupabase(userId, dataType, localData);
      }
    } catch (err) {
      console.error(`[Sync] Error syncing ${dataType}:`, err);
    }
  }

  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  console.log("[Sync] Full sync completed at", new Date().toISOString());
}

/**
 * Quick push: save a single data type to Supabase (called after local save).
 * Non-blocking — fire and forget.
 */
export function pushDataType(userId: string, dataType: SyncDataType): void {
  if (!supabase) return;
  const data = getLocalData(dataType);
  syncToSupabase(userId, dataType, data).catch((err) =>
    console.error(`[Sync] Background push failed for ${dataType}:`, err)
  );
}

/**
 * Get the last sync timestamp.
 */
export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
