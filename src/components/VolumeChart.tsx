"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Dumbbell, TrendingUp, Target, Flame, ChevronRight } from "lucide-react";
import { DayWorkoutLog, getAllWorkoutLogs } from "@/lib/storage";
import type { WorkoutDay } from "@/lib/workouts";
import { usePlan } from "@/context/PlanContext";

type TimeRange = "1W" | "1M" | "3M" | "ALL";
/** "all", or the id of one of the user's routines. */
type Category = string;

interface WeeklyExerciseStat {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  setsCompleted: number;
  targetSets: number;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
}

interface WeeklyOverview {
  workoutsCompleted: number;
  totalSets: number;
  totalVolume: number;
  exerciseStats: WeeklyExerciseStat[];
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDateCutoff(range: TimeRange): string | null {
  if (range === "ALL") return null;
  const now = new Date();
  if (range === "1W") now.setDate(now.getDate() - 7);
  else if (range === "1M") now.setMonth(now.getMonth() - 1);
  else if (range === "3M") now.setMonth(now.getMonth() - 3);
  return now.toISOString().split("T")[0];
}

function calculateWeeklyOverview(
  logs: Record<string, DayWorkoutLog>,
  workoutDays: WorkoutDay[]
): WeeklyOverview {
  const weekStart = getWeekStart();
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const weekLogs = Object.values(logs).filter((l) => l.date >= weekStartStr);
  let totalSets = 0;
  let totalVolume = 0;

  // Build exercise stats
  const exerciseMap: Record<string, WeeklyExerciseStat> = {};

  // Init all exercises from workout definitions
  for (const day of workoutDays) {
    for (const ex of day.exercises) {
      exerciseMap[ex.id] = {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscle: ex.muscle,
        setsCompleted: 0,
        // One target per scheduled session of the workout this exercise is in.
        targetSets: ex.sets * Math.max(1, day.dayNumbers.length),
        bestWeight: 0,
        bestReps: 0,
        totalVolume: 0,
      };
    }
  }

  for (const log of weekLogs) {
    for (const exercise of log.exercises) {
      const stat = exerciseMap[exercise.exerciseId];
      if (!stat) continue;
      for (const set of exercise.sets) {
        if (set.completed) {
          stat.setsCompleted++;
          totalSets++;
          if (set.weight > 0 && set.reps > 0) {
            const vol = set.weight * set.reps;
            stat.totalVolume += vol;
            totalVolume += vol;
            if (
              set.weight > stat.bestWeight ||
              (set.weight === stat.bestWeight && set.reps > stat.bestReps)
            ) {
              stat.bestWeight = set.weight;
              stat.bestReps = set.reps;
            }
          }
        }
      }
    }
  }

  return {
    workoutsCompleted: weekLogs.length,
    totalSets,
    totalVolume,
    exerciseStats: Object.values(exerciseMap),
  };
}

/** One point per session; a key per routine id holds that session's volume. */
type VolumeDataPoint = {
  date: string;
  label: string;
} & Record<string, string | number | null>;

/** Series colours, cycled when a plan has more routines than colours. */
const SERIES_COLORS = [
  "#DCF64F",
  "#60A5FA",
  "#FB923C",
  "#A78BFA",
  "#F472B6",
  "#2DD4BF",
];

function buildVolumeData(
  logs: Record<string, DayWorkoutLog>,
  range: TimeRange,
  routineIds: string[]
): VolumeDataPoint[] {
  const cutoff = getDateCutoff(range);
  const known = new Set(routineIds);
  const entries = Object.values(logs)
    .filter((log) => {
      if (cutoff && log.date < cutoff) return false;
      if (!known.has(log.workoutId)) return false;
      let vol = 0;
      for (const ex of log.exercises) {
        for (const s of ex.sets) {
          if (s.completed && s.reps > 0 && s.weight > 0) vol += s.reps * s.weight;
        }
      }
      return vol > 0;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return entries.map((log) => {
    let vol = 0;
    for (const ex of log.exercises) {
      for (const s of ex.sets) {
        if (s.completed && s.reps > 0 && s.weight > 0) vol += s.reps * s.weight;
      }
    }
    const point: VolumeDataPoint = {
      date: log.date,
      label: new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
    for (const id of routineIds) {
      point[id] = log.workoutId === id ? vol : null;
    }
    return point;
  });
}

interface WeeklySetsData {
  name: string;
  sets: number;
  target: number;
}

function buildWeeklySetsData(
  exerciseStats: WeeklyExerciseStat[],
  category: Category,
  workoutDays: WorkoutDay[]
): WeeklySetsData[] {
  let filtered = exerciseStats;
  if (category !== "all") {
    const dayExIds = new Set(
      workoutDays
        .find((d) => d.id === category)
        ?.exercises.map((e) => e.id) || []
    );
    filtered = exerciseStats.filter((s) => dayExIds.has(s.exerciseId));
  }
  return filtered
    .filter((s) => s.targetSets > 0)
    .map((s) => ({
      name: s.exerciseName.length > 15
        ? s.exerciseName.substring(0, 14) + "…"
        : s.exerciseName,
      sets: s.setsCompleted,
      target: s.targetSets,
    }));
}

export default function VolumeChart() {
  const { workoutDays } = usePlan();
  const [logs, setLogs] = useState<Record<string, DayWorkoutLog>>({});
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [category, setCategory] = useState<Category>("all");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    setLogs(getAllWorkoutLogs());
  }, []);

  const routineIds = useMemo(() => workoutDays.map((d) => d.id), [workoutDays]);

  const overview = useMemo(
    () => calculateWeeklyOverview(logs, workoutDays),
    [logs, workoutDays]
  );
  const volumeData = useMemo(
    () => buildVolumeData(logs, timeRange, routineIds),
    [logs, timeRange, routineIds]
  );
  const weeklySetsData = useMemo(
    () => buildWeeklySetsData(overview.exerciseStats, category, workoutDays),
    [overview.exerciseStats, category, workoutDays]
  );

  const maxVolume = useMemo(() => {
    let max = 0;
    for (const d of volumeData) {
      for (const id of routineIds) {
        const v = d[id];
        if (typeof v === "number" && v > max) max = v;
      }
    }
    return max;
  }, [volumeData, routineIds]);

  const routineNames = useMemo(
    () => Object.fromEntries(workoutDays.map((d) => [d.id, d.name])),
    [workoutDays]
  );

  const overviewCards = [
    {
      icon: Dumbbell,
      iconBg: "bg-blue/8",
      iconColor: "text-blue",
      label: "Workouts",
      value: overview.workoutsCompleted,
      sub: "this week",
    },
    {
      icon: Target,
      iconBg: "bg-success/8",
      iconColor: "text-success",
      label: "Sets",
      value: overview.totalSets,
      sub: "completed",
    },
    {
      icon: Flame,
      iconBg: "bg-orange/8",
      iconColor: "text-orange",
      label: "Volume",
      value:
        overview.totalVolume >= 1000
          ? `${(overview.totalVolume / 1000).toFixed(1)}k`
          : overview.totalVolume,
      sub: "kg total",
    },
  ];

  const categories: { id: Category; label: string }[] = [
    { id: "all", label: "All" },
    ...workoutDays.map((d) => ({ id: d.id, label: d.name })),
  ];

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "ALL"];

  // Get exercises for expanded category view
  const getCategoryExercises = (catId: string) => {
    const dayExIds = new Set(
      workoutDays.find((d) => d.id === catId)?.exercises.map((e) => e.id) || []
    );
    return overview.exerciseStats.filter((s) => dayExIds.has(s.exerciseId));
  };

  return (
    <div>
      {/* Weekly Overview Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {overviewCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="surface rounded-2xl p-3 shadow-[var(--shadow-card)]"
          >
            <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center mb-2`}>
              <card.icon size={14} className={card.iconColor} />
            </div>
            <p className="text-lg font-bold text-text-primary">{card.value}</p>
            <p className="text-[10px] text-text-subtle">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Sets by Exercise */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Weekly Sets Progress
        </h3>

        {/* Category filter */}
        <div className="flex gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat.id
                  ? "grad-primary text-[#14151A] shadow-[var(--glow-primary)]"
                  : "bg-bg-surface text-text-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Category breakdown cards */}
        {category === "all" ? (
          <div className="space-y-3">
            {workoutDays.map((day) => {
              const exercises = getCategoryExercises(day.id);
              const totalSets = exercises.reduce((s, e) => s + e.setsCompleted, 0);
              const targetSets = exercises.reduce((s, e) => s + e.targetSets, 0);
              const pct = targetSets > 0 ? Math.round((totalSets / targetSets) * 100) : 0;
              const isExpanded = expandedCategory === day.id;

              return (
                <div
                  key={day.id}
                  className="surface rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : day.id)}
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <span className="text-lg">{day.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-text-primary">
                        {day.name}
                      </p>
                      <p className="text-xs text-text-subtle">
                        {totalSets}/{targetSets} sets · {pct}%
                      </p>
                    </div>
                    <div className="w-16 h-1.5 bg-bg-surface rounded-full overflow-hidden mr-2">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-text-subtle transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {exercises.map((ex) => {
                        const exPct =
                          ex.targetSets > 0
                            ? Math.round((ex.setsCompleted / ex.targetSets) * 100)
                            : 0;
                        return (
                          <div key={ex.exerciseId} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">
                                {ex.exerciseName}
                              </p>
                              <p className="text-[10px] text-text-subtle">{ex.muscle}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium text-text-primary">
                                {ex.setsCompleted}/{ex.targetSets}
                              </p>
                              {ex.bestWeight > 0 && (
                                <p className="text-[10px] text-text-subtle">
                                  {ex.bestWeight}kg x {ex.bestReps}
                                </p>
                              )}
                            </div>
                            <div className="w-12 h-1.5 bg-bg-surface rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  exPct >= 100 ? "bg-success" : "bg-accent"
                                }`}
                                style={{ width: `${Math.min(exPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="surface rounded-2xl p-4 shadow-[var(--shadow-card)]">
            {weeklySetsData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklySetsData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#62655F", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#62655F", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#15151C",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F4F5F0",
                      }}
                    />
                    <Bar
                      dataKey="target"
                      fill="rgba(255,255,255,0.08)"
                      radius={[0, 4, 4, 0]}
                      name="Target"
                    />
                    <Bar
                      dataKey="sets"
                      fill="#22C55E"
                      radius={[0, 4, 4, 0]}
                      name="Completed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                No data for this week yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Volume Trends */}
      {volumeData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Volume Trends
            </h3>
            <div className="flex gap-1">
              {timeRanges.map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    timeRange === r
                      ? "grad-primary text-[#14151A] shadow-[var(--glow-primary)]"
                      : "bg-bg-surface text-text-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="surface rounded-2xl p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs text-text-subtle mb-3">
              Total volume (sets x reps x weight) per session
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={volumeData}
                  margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.07)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#62655F", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.09)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#62655F", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                    }
                    domain={[0, Math.ceil((maxVolume * 1.1) / 1000) * 1000]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#15151C",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F4F5F0",
                    }}
                    labelStyle={{ color: "#9A9C94" }}
                    formatter={(value: unknown, name: unknown) => [
                      `${Number(value).toLocaleString()} kg`,
                      routineNames[String(name)] ?? String(name),
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    formatter={(value: string) => routineNames[value] ?? value}
                  />
                  {workoutDays.map((day, i) => {
                    const color = SERIES_COLORS[i % SERIES_COLORS.length];
                    return (
                      <Line
                        key={day.id}
                        type="monotone"
                        dataKey={day.id}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color }}
                        activeDot={{ r: 5 }}
                        connectNulls={true}
                        name={day.id}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
