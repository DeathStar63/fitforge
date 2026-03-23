"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { DayWorkoutLog } from "@/lib/storage";

const WORKOUT_LOG_KEY = "fitforge_workout_logs";

interface VolumeDataPoint {
  date: string;
  label: string;
  legs: number | null;
  push: number | null;
  pull: number | null;
}

function calculateSessionVolume(log: DayWorkoutLog): number {
  let volume = 0;
  for (const exercise of log.exercises) {
    for (const set of exercise.sets) {
      if (set.completed && set.reps > 0 && set.weight > 0) {
        volume += set.reps * set.weight;
      }
    }
  }
  return volume;
}

function getWorkoutType(workoutId: string): "legs" | "push" | "pull" | null {
  if (workoutId === "legs") return "legs";
  if (workoutId === "push") return "push";
  if (workoutId === "pull") return "pull";
  return null;
}

export default function VolumeChart() {
  const [data, setData] = useState<VolumeDataPoint[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(WORKOUT_LOG_KEY);
    if (!raw) return;

    const logs: Record<string, DayWorkoutLog> = JSON.parse(raw);
    const entries = Object.values(logs)
      .filter((log) => {
        const type = getWorkoutType(log.workoutId);
        if (!type) return false;
        const vol = calculateSessionVolume(log);
        return vol > 0;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const points: VolumeDataPoint[] = entries.map((log) => {
      const type = getWorkoutType(log.workoutId)!;
      const vol = calculateSessionVolume(log);
      return {
        date: log.date,
        label: new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        legs: type === "legs" ? vol : null,
        push: type === "push" ? vol : null,
        pull: type === "pull" ? vol : null,
      };
    });

    setData(points);
  }, []);

  const maxVolume = useMemo(() => {
    let max = 0;
    for (const d of data) {
      if (d.legs && d.legs > max) max = d.legs;
      if (d.push && d.push > max) max = d.push;
      if (d.pull && d.pull > max) max = d.pull;
    }
    return max;
  }, [data]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Volume Trends
      </h3>
      <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs text-text-subtle mb-3">
          Total volume (sets x reps x weight) per session
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                }
                domain={[0, Math.ceil((maxVolume * 1.1) / 1000) * 1000]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#1A1A2E",
                }}
                labelStyle={{ color: "#6B7280" }}
                itemStyle={{ padding: "2px 0" }}
                formatter={(value: unknown, name: unknown) => [
                  `${Number(value).toLocaleString()} kg`,
                  String(name).charAt(0).toUpperCase() + String(name).slice(1),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value: string) =>
                  value.charAt(0).toUpperCase() + value.slice(1)
                }
              />
              <Line
                type="monotone"
                dataKey="legs"
                stroke="#06D6A0"
                strokeWidth={2}
                dot={{ r: 3, fill: "#06D6A0" }}
                activeDot={{ r: 5 }}
                connectNulls={true}
                name="legs"
              />
              <Line
                type="monotone"
                dataKey="push"
                stroke="#4EA8DE"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4EA8DE" }}
                activeDot={{ r: 5 }}
                connectNulls={true}
                name="push"
              />
              <Line
                type="monotone"
                dataKey="pull"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ r: 3, fill: "#FF6B35" }}
                activeDot={{ r: 5 }}
                connectNulls={true}
                name="pull"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
