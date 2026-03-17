"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Send,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Loader2,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import {
  getNutritionLog,
  saveNutritionEntry,
  deleteNutritionEntry,
  getDateKey,
  NutritionEntry,
  DayNutritionLog,
} from "@/lib/storage";
import { analyzeFood, analyzeFoodImage } from "@/lib/gemini";

export default function NutritionTab() {
  const [log, setLog] = useState<DayNutritionLog>({ date: getDateKey(), entries: [] });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLog(getNutritionLog());
  }, []);

  const totals = log.entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.totalCalories,
      protein: acc.protein + entry.totalProtein,
      carbs: acc.carbs + entry.totalCarbs,
      fats: acc.fats + entry.totalFats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleTextSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await analyzeFood(input.trim());
      const parsed = JSON.parse(result);
      const entry: NutritionEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        description: input.trim(),
        items: parsed.items,
        totalCalories: parsed.totalCalories,
        totalProtein: parsed.totalProtein,
        totalCarbs: parsed.totalCarbs,
        totalFats: parsed.totalFats,
      };
      saveNutritionEntry(entry);
      setLog(getNutritionLog());
      setInput("");
      setShowInput(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze food.";
      setError(msg.includes("Rate limit") ? msg : "Failed to analyze food. Check your Gemini API key.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await analyzeFoodImage(base64, file.type);
        const parsed = JSON.parse(result);
        const entry: NutritionEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          description: `Photo: ${parsed.summary || "Meal photo"}`,
          items: parsed.items,
          totalCalories: parsed.totalCalories,
          totalProtein: parsed.totalProtein,
          totalCarbs: parsed.totalCarbs,
          totalFats: parsed.totalFats,
        };
        saveNutritionEntry(entry);
        setLog(getNutritionLog());
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setError("Failed to analyze image.");
      setLoading(false);
      console.error(e);
    }
  };

  const handleDelete = (entryId: string) => {
    deleteNutritionEntry(entryId);
    setLog(getNutritionLog());
  };

  const macroCards = [
    { label: "Calories", value: totals.calories, unit: "kcal", icon: Flame, color: "text-orange", bg: "bg-orange/8" },
    { label: "Protein", value: totals.protein, unit: "g", icon: Beef, color: "text-blue", bg: "bg-blue/8" },
    { label: "Carbs", value: totals.carbs, unit: "g", icon: Wheat, color: "text-success", bg: "bg-success/8" },
    { label: "Fats", value: totals.fats, unit: "g", icon: Droplets, color: "text-pink", bg: "bg-pink/8" },
  ];

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nutrition</h1>
          <p className="text-sm text-text-muted mt-1">
            {log.entries.length} meals logged today
          </p>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"
        >
          {showInput ? (
            <X size={18} className="text-bg-primary" />
          ) : (
            <Plus size={18} className="text-bg-primary" />
          )}
        </button>
      </div>

      {/* Macro summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {macroCards.map((macro) => (
          <motion.div
            key={macro.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${macro.bg} flex items-center justify-center`}>
                <macro.icon size={14} className={macro.color} />
              </div>
              <span className="text-xs text-text-subtle">{macro.label}</span>
            </div>
            <p className="text-xl font-bold text-text-primary">
              {Math.round(macro.value)}
              <span className="text-xs font-normal text-text-subtle ml-1">
                {macro.unit}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Track on Healthify */}
      <a
        href="hmein://activity/DashboardActivity"
        className="flex items-center gap-3 mb-5 px-4 py-3.5 bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] active:scale-[0.98] transition-transform"
      >
        <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <span className="text-success font-bold text-sm">H</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">Track on HealthifyMe</p>
          <p className="text-xs text-text-subtle">Open app to log calories</p>
        </div>
        <ExternalLink size={16} className="text-text-subtle shrink-0" />
      </a>

      {/* Input area */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs text-text-subtle mb-3">
                Describe what you ate or snap a photo
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder="e.g. 2 rotis with dal and rice..."
                  className="flex-1 bg-bg-input rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
                  disabled={loading}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  className="w-12 h-12 rounded-xl bg-bg-input flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <Camera size={18} />
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={loading || !input.trim()}
                  className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 size={18} className="text-bg-primary animate-spin" />
                  ) : (
                    <Send size={18} className="text-bg-primary" />
                  )}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
              {error && (
                <p className="text-xs text-error mt-2">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {loading && !showInput && (
        <div className="mb-5 bg-bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-[var(--shadow-card)]">
          <Loader2 size={18} className="text-accent animate-spin" />
          <span className="text-sm text-text-muted">
            Analyzing your meal with AI...
          </span>
        </div>
      )}

      {/* Meal entries */}
      <div className="flex flex-col gap-3">
        {log.entries.length === 0 && !showInput && (
          <div className="text-center py-12">
            <UtensilsCrossedIcon />
            <p className="text-sm text-text-muted mt-3">
              No meals logged yet today
            </p>
            <p className="text-xs text-text-subtle mt-1">
              Tap + to log your first meal
            </p>
          </div>
        )}

        <AnimatePresence>
          {[...log.entries].reverse().map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {entry.description}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 text-text-subtle hover:text-error transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Item breakdown */}
              <div className="space-y-1 mb-3">
                {entry.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-text-muted">
                      {item.name} ({item.quantity})
                    </span>
                    <span className="text-text-subtle">{item.calories} kcal</span>
                  </div>
                ))}
              </div>

              {/* Macro pills */}
              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-orange/8 text-orange font-medium">
                  {entry.totalCalories} kcal
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-blue/8 text-blue font-medium">
                  {entry.totalProtein}g P
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-success/8 text-success font-medium">
                  {entry.totalCarbs}g C
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-pink/8 text-pink font-medium">
                  {entry.totalFats}g F
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Empty state icon
function UtensilsCrossedIcon() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mx-auto">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-subtle"
      >
        <path d="M16 2v20M12 2v6.5a4 4 0 0 0 4 4M8 2v6.5a4 4 0 0 1 4 4M3 2l0 11M3 17l0 5M3 13a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
      </svg>
    </div>
  );
}
