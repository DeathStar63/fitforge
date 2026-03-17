"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { workoutDays } from "@/lib/workouts";
import { DayWorkoutLog } from "@/lib/storage";

type TimeRange = "1w" | "1m" | "3m" | "all";

export default function ProgressTab() {
  const [logs, setLogs] = useState<Record<string, DayWorkoutLog>>({});
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("fitforge_workout_logs");
    if (raw) {
      try {
        setLogs(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // Build list of all exercises
  const allExercises = useMemo(() => {
    const exercises: { id: string; name: string; workoutId: string; workoutName: string }[] = [];
    for (const day of workoutDays) {
      for (const ex of day.exercises) {
        exercises.push({ id: ex.id, name: ex.name, workoutId: day.id, workoutName: day.name });
      }
    }
    return exercises;
  }, []);

  // Group exercises by workout
  const exercisesByWorkout = useMemo(() => {
    const grouped: Record<string, typeof allExercises> = {};
    for (const ex of allExercises) {
      if (!grouped[ex.workoutId]) grouped[ex.workoutId] = [];
      grouped[ex.workoutId].push(ex);
    }
    return grouped;
  }, [allExercises]);

  // Filter logs by time range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "1w") cutoff.setDate(now.getDate() - 7);
    else if (timeRange === "1m") cutoff.setMonth(now.getMonth() - 1);
    else if (timeRange === "3m") cutoff.setMonth(now.getMonth() - 3);
    else cutoff.setFullYear(2000);

    const cutoffStr = cutoff.toISOString().split("T")[0];
    return Object.entries(logs)
      .filter(([date]) => date >= cutoffStr)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [logs, timeRange]);

  // Get weight progression for a specific exercise
  const getExerciseProgress = (exerciseId: string) => {
    const data: { date: string; maxWeight: number; totalVolume: number; bestSet: string }[] = [];

    for (const [date, log] of filteredLogs) {
      const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) continue;

      const completedSets = exLog.sets.filter((s) => s.completed && s.weight > 0);
      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weight));
      const totalVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const bestSet = completedSets.reduce((best, s) =>
        s.weight > best.weight ? s : best
      );

      data.push({
        date,
        maxWeight,
        totalVolume,
        bestSet: `${bestSet.weight}kg × ${bestSet.reps}`,
      });
    }

    return data;
  };

  // Get summary stats for an exercise
  const getExerciseStats = (exerciseId: string) => {
    const allData: { date: string; maxWeight: number }[] = [];

    for (const [date, log] of Object.entries(logs).sort(([a], [b]) => a.localeCompare(b))) {
      const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) continue;
      const completedSets = exLog.sets.filter((s) => s.completed && s.weight > 0);
      if (completedSets.length === 0) continue;
      allData.push({ date, maxWeight: Math.max(...completedSets.map((s) => s.weight)) });
    }

    if (allData.length < 2) return null;

    const first = allData[0];
    const last = allData[allData.length - 1];
    const change = last.maxWeight - first.maxWeight;
    const pct = ((change / first.maxWeight) * 100).toFixed(1);

    return {
      firstWeight: first.maxWeight,
      currentWeight: last.maxWeight,
      change,
      pct,
      sessions: allData.length,
    };
  };

  const selectedProgress = selectedExercise ? getExerciseProgress(selectedExercise) : [];
  const selectedStats = selectedExercise ? getExerciseStats(selectedExercise) : null;
  const selectedName = allExercises.find((e) => e.id === selectedExercise)?.name || "";

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: "1W", value: "1w" },
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Progress</h1>
        <p className="text-sm text-text-muted mt-1">
          Track your lifting progress over time
        </p>
      </div>

      {/* Time range selector */}
      <div className="flex gap-1 mb-5 bg-bg-card rounded-xl p-1 border border-border">
        {timeRanges.map((tr) => (
          <button
            key={tr.value}
            onClick={() => setTimeRange(tr.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              timeRange === tr.value
                ? "bg-accent text-bg-primary"
                : "text-text-subtle"
            }`}
          >
            {tr.label}
          </button>
        ))}
      </div>

      {/* Exercise selector */}
      <div className="mb-5 space-y-2">
        {workoutDays.map((day) => (
          <div key={day.id} className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
            <button
              onClick={() => setExpandedWorkout(expandedWorkout === day.id ? null : day.id)}
              className="w-full flex items-center justify-between p-3.5"
            >
              <span className="text-sm font-semibold text-text-primary">
                {day.emoji} {day.name}
              </span>
              {expandedWorkout === day.id ? (
                <ChevronUp size={16} className="text-text-subtle" />
              ) : (
                <ChevronDown size={16} className="text-text-subtle" />
              )}
            </button>

            {expandedWorkout === day.id && (
              <div className="px-3 pb-3 space-y-1">
                {exercisesByWorkout[day.id]?.map((ex) => {
                  const stats = getExerciseStats(ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExercise(selectedExercise === ex.id ? null : ex.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                        selectedExercise === ex.id
                          ? "bg-accent/10 border border-accent/20"
                          : "bg-bg-surface"
                      }`}
                    >
                      <span className="text-xs text-text-primary">{ex.name}</span>
                      {stats && (
                        <span className={`text-[10px] font-medium ${stats.change >= 0 ? "text-success" : "text-error"}`}>
                          {stats.change >= 0 ? "+" : ""}{stats.change}kg
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress chart */}
      {selectedExercise && selectedProgress.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-4 mb-5 shadow-[var(--shadow-card)]"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {selectedName}
          </h3>
          <p className="text-[10px] text-text-subtle mb-3">Max weight per session</p>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={selectedProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
                tick={{ fontSize: 10, fill: "#5C5C72" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#5C5C72" }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A28",
                  border: "1px solid #2A2A3E",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#F0F0F0",
                }}
                labelFormatter={(d: unknown) => {
                  const date = new Date(String(d));
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                formatter={(value: unknown) => [`${value} kg`, "Max Weight"]}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: "#22C55E", r: 4 }}
                activeDot={{ fill: "#22C55E", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Comparison stats */}
      {selectedExercise && selectedStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-4 mb-5 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-success" />
            <h3 className="text-sm font-semibold text-text-primary">Progress Summary</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-surface rounded-xl p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-1">Starting</p>
              <p className="text-lg font-bold text-text-primary">{selectedStats.firstWeight}<span className="text-xs font-normal text-text-subtle ml-0.5">kg</span></p>
            </div>
            <div className="bg-bg-surface rounded-xl p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-1">Current</p>
              <p className="text-lg font-bold text-text-primary">{selectedStats.currentWeight}<span className="text-xs font-normal text-text-subtle ml-0.5">kg</span></p>
            </div>
            <div className="bg-bg-surface rounded-xl p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-1">Change</p>
              <p className={`text-lg font-bold ${selectedStats.change >= 0 ? "text-success" : "text-error"}`}>
                {selectedStats.change >= 0 ? "+" : ""}{selectedStats.change}<span className="text-xs font-normal ml-0.5">kg</span>
              </p>
              <p className="text-[10px] text-text-subtle">{selectedStats.pct}%</p>
            </div>
            <div className="bg-bg-surface rounded-xl p-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider mb-1">Sessions</p>
              <p className="text-lg font-bold text-text-primary">{selectedStats.sessions}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent sessions table */}
      {selectedExercise && selectedProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border overflow-hidden mb-5 shadow-[var(--shadow-card)]"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Session History</h3>
          </div>
          {[...selectedProgress].reverse().map((session, i) => (
            <div
              key={session.date}
              className={`flex items-center justify-between px-4 py-3 ${
                i < selectedProgress.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(session.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-subtle">
                  Best: {session.bestSet}
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {session.maxWeight}kg
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {selectedExercise && selectedProgress.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">No data yet for this exercise</p>
          <p className="text-xs text-text-subtle mt-1">Complete workouts to see progress</p>
        </div>
      )}

      {!selectedExercise && (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">Select an exercise above</p>
          <p className="text-xs text-text-subtle mt-1">to view your lifting progress</p>
        </div>
      )}
    </div>
  );
}
