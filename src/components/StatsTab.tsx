"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Footprints,
  Flame,
  Timer,
  Plus,
  Smartphone,
} from "lucide-react";
import { useSync } from "@/context/SyncContext";
import VolumeChart from "./VolumeChart";
import { getDateKey } from "@/lib/storage";

// ---- Apple Health Activity Data ----
const ACTIVITY_KEY = "fitforge_activity_logs";

interface ActivityEntry {
  date: string;
  steps: number;
  activeCalories: number;
  exerciseMinutes: number;
  restingHeartRate: number;
}

function getActivityLog(date?: string): ActivityEntry | null {
  const key = date || getDateKey();
  const logs = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "{}");
  return logs[key] || null;
}

function saveActivityLog(entry: ActivityEntry): void {
  const logs = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "{}");
  logs[entry.date] = entry;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs));
}

export default function StatsTab() {
  const { syncAfterSave } = useSync();
  const [activity, setActivity] = useState<ActivityEntry | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [steps, setSteps] = useState("");
  const [activeCal, setActiveCal] = useState("");
  const [exerciseMin, setExerciseMin] = useState("");
  const [restingHR, setRestingHR] = useState("");

  useEffect(() => {
    const today = getActivityLog();
    if (today) {
      setActivity(today);
      setSteps(today.steps > 0 ? today.steps.toString() : "");
      setActiveCal(today.activeCalories > 0 ? today.activeCalories.toString() : "");
      setExerciseMin(today.exerciseMinutes > 0 ? today.exerciseMinutes.toString() : "");
      setRestingHR(today.restingHeartRate > 0 ? today.restingHeartRate.toString() : "");
    }
  }, []);

  const handleSaveActivity = () => {
    const entry: ActivityEntry = {
      date: getDateKey(),
      steps: parseInt(steps) || 0,
      activeCalories: parseInt(activeCal) || 0,
      exerciseMinutes: parseInt(exerciseMin) || 0,
      restingHeartRate: parseInt(restingHR) || 0,
    };
    saveActivityLog(entry);
    setActivity(entry);
    setShowActivityForm(false);
    syncAfterSave("body_stats");
  };

  const activityCards = [
    {
      icon: Footprints,
      iconBg: "bg-blue/8",
      iconColor: "text-blue",
      label: "Steps",
      value: activity?.steps || "—",
      target: "10,000",
      progress: activity ? Math.min((activity.steps / 10000) * 100, 100) : 0,
      color: "bg-blue",
    },
    {
      icon: Flame,
      iconBg: "bg-orange/8",
      iconColor: "text-orange",
      label: "Active Cal",
      value: activity?.activeCalories || "—",
      target: "500",
      progress: activity
        ? Math.min((activity.activeCalories / 500) * 100, 100)
        : 0,
      color: "bg-orange",
    },
    {
      icon: Timer,
      iconBg: "bg-success/8",
      iconColor: "text-success",
      label: "Exercise",
      value: activity?.exerciseMinutes ? `${activity.exerciseMinutes}m` : "—",
      target: "120m",
      progress: activity
        ? Math.min((activity.exerciseMinutes / 120) * 100, 100)
        : 0,
      color: "bg-success",
    },
    {
      icon: Heart,
      iconBg: "bg-pink/8",
      iconColor: "text-pink",
      label: "Resting HR",
      value: activity?.restingHeartRate ? `${activity.restingHeartRate}` : "—",
      target: "bpm",
      progress: 0,
      color: "bg-pink",
    },
  ];

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Statistics</h1>
        <p className="text-sm text-text-muted mt-1">
          Training insights & activity
        </p>
      </div>

      {/* Volume Trends (main content) */}
      <VolumeChart />

      {/* Apple Health / Activity Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-pink/8 flex items-center justify-center">
              <Heart size={13} className="text-pink" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Activity
            </h3>
          </div>
          <button
            onClick={() => setShowActivityForm(!showActivityForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-surface text-xs font-medium text-text-primary"
          >
            <Plus size={12} />
            {showActivityForm ? "Cancel" : "Log"}
          </button>
        </div>

        {/* Activity cards */}
        {activity && !showActivityForm && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {activityCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-bg-card rounded-2xl border border-border p-3 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-6 h-6 rounded-lg ${card.iconBg} flex items-center justify-center`}
                  >
                    <card.icon size={12} className={card.iconColor} />
                  </div>
                  <span className="text-[10px] text-text-subtle">{card.label}</span>
                </div>
                <p className="text-lg font-bold text-text-primary">
                  {card.value}
                </p>
                {card.progress > 0 && (
                  <div className="mt-2">
                    <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full ${card.color} rounded-full transition-all`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-text-subtle mt-0.5">
                      / {card.target}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Activity input form */}
        {(showActivityForm || !activity) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-2xl border border-border p-4 mb-4 shadow-[var(--shadow-card)]"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-subtle mb-1 block">
                  Steps
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-bg-input rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-subtle mb-1 block">
                  Active Calories
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={activeCal}
                  onChange={(e) => setActiveCal(e.target.value)}
                  placeholder="500"
                  className="w-full bg-bg-input rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-subtle mb-1 block">
                  Exercise (min)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={exerciseMin}
                  onChange={(e) => setExerciseMin(e.target.value)}
                  placeholder="120"
                  className="w-full bg-bg-input rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-subtle mb-1 block">
                  Resting HR (bpm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={restingHR}
                  onChange={(e) => setRestingHR(e.target.value)}
                  placeholder="65"
                  className="w-full bg-bg-input rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
            <button
              onClick={handleSaveActivity}
              className="w-full mt-3 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-semibold"
            >
              Save Activity
            </button>
          </motion.div>
        )}

        {/* Apple Health connect note */}
        <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink/8 flex items-center justify-center shrink-0">
              <Smartphone size={18} className="text-pink" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-text-primary">
                Apple Health Sync
              </p>
              <p className="text-[10px] text-text-subtle mt-0.5">
                Auto-sync requires wrapping this PWA as a native iOS app (e.g.
                via Capacitor). For now, log your activity manually from Apple
                Health data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
