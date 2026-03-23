"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Ruler,
  Brain,
  TrendingDown,
  TrendingUp,
  Loader2,
  Sparkles,
  Activity,
  Upload,
  FileImage,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getBodyStats,
  saveBodyStats,
  getLatestBodyStats,
  BodyStats,
  getDateKey,
  getInBodyReports,
  saveInBodyReport,
  deleteInBodyReport,
  InBodyReport,
} from "@/lib/storage";
import { analyzeBody, analyzeInBodyReport } from "@/lib/gemini";
import { useSync } from "@/context/SyncContext";
import VolumeChart from "./VolumeChart";

export default function StatsTab() {
  const { syncAfterSave } = useSync();
  const [stats, setStats] = useState<BodyStats[]>([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("25");
  const [bodyFat, setBodyFat] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // InBody state
  const [inbodyReports, setInbodyReports] = useState<InBodyReport[]>([]);
  const [inbodyLoading, setInbodyLoading] = useState(false);
  const [inbodyError, setInbodyError] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const inbodyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allStats = getBodyStats();
    setStats(allStats);
    const latest = getLatestBodyStats();
    if (latest) {
      setWeight(latest.weight.toString());
      setHeight(latest.height.toString());
      setAge(latest.age.toString());
      if (latest.bodyFat) setBodyFat(latest.bodyFat.toString());
    }
    setInbodyReports(getInBodyReports());
  }, []);

  const bmi =
    weight && height
      ? parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)
      : 0;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-orange" };
    if (bmi < 25) return { label: "Normal", color: "text-success" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange" };
    return { label: "Obese", color: "text-error" };
  };

  const bmiCat = bmi > 0 ? getBmiCategory(bmi) : null;

  const handleSave = () => {
    if (!weight || !height) return;
    const entry: BodyStats = {
      date: getDateKey(),
      weight: parseFloat(weight),
      height: parseFloat(height),
      age: parseInt(age) || 25,
      bmi: Math.round(bmi * 10) / 10,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
    };
    saveBodyStats(entry);
    syncAfterSave("body_stats");
    setStats(getBodyStats());
    setShowForm(false);
  };

  const handleAnalyze = async () => {
    if (!weight || !height || loading) return;
    setLoading(true);
    setAnalysis("");
    try {
      const result = await analyzeBody({
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age) || 25,
        bmi: Math.round(bmi * 10) / 10,
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      });
      setAnalysis(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get analysis.";
      setAnalysis(msg.includes("Rate limit") ? msg : "Failed to get analysis. Check your Gemini API key.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInBodyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInbodyLoading(true);
    setInbodyError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fullBase64 = reader.result as string;
        const base64Data = fullBase64.split(",")[1];
        try {
          const analysisResult = await analyzeInBodyReport(base64Data, file.type);

          // Compress image for storage (resize to thumbnail)
          const thumbnail = await compressImage(fullBase64, 400);

          const report: InBodyReport = {
            id: Date.now().toString(),
            date: getDateKey(),
            imageData: thumbnail,
            analysis: analysisResult,
          };
          saveInBodyReport(report);
          syncAfterSave("inbody_reports");
          setInbodyReports(getInBodyReports());
          setExpandedReport(report.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to analyze report.";
          setInbodyError(msg.includes("Rate limit") ? msg : "Failed to analyze InBody report. Check your Gemini API key.");
          console.error(err);
        }
        setInbodyLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setInbodyError("Failed to read image.");
      setInbodyLoading(false);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDeleteReport = (id: string) => {
    deleteInBodyReport(id);
    syncAfterSave("inbody_reports");
    setInbodyReports(getInBodyReports());
    if (expandedReport === id) setExpandedReport(null);
  };

  const weightChange =
    stats.length >= 2
      ? stats[stats.length - 1].weight - stats[stats.length - 2].weight
      : null;

  const statCards = [
    {
      icon: Scale,
      iconBg: "bg-blue/8",
      iconColor: "text-blue",
      label: "Weight",
      value: stats.length > 0 ? `${stats[stats.length - 1].weight}` : "—",
      unit: "kg",
      extra: weightChange !== null ? (
        <div className={`flex items-center gap-1 mt-1 ${weightChange <= 0 ? "text-success" : "text-orange"}`}>
          {weightChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          <span className="text-xs">{weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg</span>
        </div>
      ) : null,
    },
    {
      icon: Activity,
      iconBg: "bg-orange/8",
      iconColor: "text-orange",
      label: "BMI",
      value: stats.length > 0 ? `${stats[stats.length - 1].bmi}` : "—",
      unit: "",
      extra: bmiCat ? <p className={`text-xs mt-1 ${bmiCat.color}`}>{bmiCat.label}</p> : null,
    },
    {
      icon: Ruler,
      iconBg: "bg-success/8",
      iconColor: "text-success",
      label: "Height",
      value: stats.length > 0 ? `${stats[stats.length - 1].height}` : "—",
      unit: "cm",
      extra: null,
    },
    {
      icon: Brain,
      iconBg: "bg-pink/8",
      iconColor: "text-pink",
      label: "Entries",
      value: `${stats.length}`,
      unit: "",
      extra: <p className="text-xs text-text-subtle mt-1">check-ins</p>,
    },
  ];

  return (
    <div className="px-4 pt-2 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Statistics</h1>
          <p className="text-sm text-text-muted mt-1">
            Track your transformation
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-medium"
        >
          {showForm ? "Close" : "Log Stats"}
        </button>
      </div>

      {/* Current stats cards */}
      {stats.length > 0 && !showForm && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={14} className={card.iconColor} />
                </div>
                <span className="text-xs text-text-subtle">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-text-primary">
                {card.value}
                {card.unit && (
                  <span className="text-xs font-normal text-text-subtle ml-1">
                    {card.unit}
                  </span>
                )}
              </p>
              {card.extra}
            </motion.div>
          ))}
        </div>
      )}

      {/* Input form */}
      {(showForm || stats.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-5 mb-5 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Log Body Stats
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-subtle mb-1 block">
                Weight (kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="82"
                className="w-full bg-bg-input rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <div>
              <label className="text-xs text-text-subtle mb-1 block">
                Height (cm)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full bg-bg-input rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <div>
              <label className="text-xs text-text-subtle mb-1 block">Age</label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full bg-bg-input rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <div>
              <label className="text-xs text-text-subtle mb-1 block">
                Body Fat % (optional)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="20"
                className="w-full bg-bg-input rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>

            {bmi > 0 && (
              <div className="px-4 py-3 bg-bg-surface rounded-xl">
                <p className="text-xs text-text-subtle">Calculated BMI</p>
                <p className="text-lg font-bold text-text-primary">
                  {bmi.toFixed(1)}{" "}
                  {bmiCat && (
                    <span className={`text-sm font-medium ${bmiCat.color}`}>
                      ({bmiCat.label})
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!weight || !height}
                className="flex-1 py-3 rounded-xl bg-accent text-bg-primary text-sm font-semibold disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!weight || !height || loading}
                className="flex-1 py-3 rounded-xl bg-bg-surface border border-border text-text-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} className="text-orange" />
                )}
                AI Analyze
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-5 mb-5 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orange/8 flex items-center justify-center">
              <Sparkles size={14} className="text-orange" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              AI Transformation Analysis
            </h3>
          </div>
          <div className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {analysis}
          </div>
        </motion.div>
      )}

      {/* Weight Progress Chart */}
      {stats.length >= 2 && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card rounded-2xl border border-border p-4 mb-6 shadow-[var(--shadow-card)]"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Weight Progress
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.map((s) => ({
                  date: new Date(s.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  weight: s.weight,
                }))}
                margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]}
                  unit=" kg"
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
                  itemStyle={{ color: "#22C55E" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#22C55E", strokeWidth: 2, stroke: "#FFFFFF" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* InBody Report Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            InBody Reports
          </h3>
          <button
            onClick={() => inbodyFileRef.current?.click()}
            disabled={inbodyLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-primary"
          >
            {inbodyLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {inbodyLoading ? "Analyzing..." : "Upload Report"}
          </button>
          <input
            ref={inbodyFileRef}
            type="file"
            accept="image/*"
            onChange={handleInBodyUpload}
            className="hidden"
          />
        </div>

        {inbodyError && (
          <p className="text-xs text-error mb-3">{inbodyError}</p>
        )}

        {inbodyLoading && (
          <div className="bg-bg-card rounded-2xl border border-border p-4 flex items-center gap-3 mb-3 shadow-[var(--shadow-card)]">
            <Loader2 size={18} className="text-blue animate-spin" />
            <span className="text-sm text-text-muted">
              Analyzing your InBody report with AI...
            </span>
          </div>
        )}

        {inbodyReports.length === 0 && !inbodyLoading && (
          <div className="bg-bg-card rounded-2xl border border-border p-6 text-center shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 rounded-xl bg-blue/8 flex items-center justify-center mx-auto mb-3">
              <FileImage size={22} className="text-blue" />
            </div>
            <p className="text-sm text-text-muted">No InBody reports yet</p>
            <p className="text-xs text-text-subtle mt-1">
              Upload your InBody result image for AI analysis
            </p>
          </div>
        )}

        <AnimatePresence>
          {inbodyReports.map((report) => {
            const isExpanded = expandedReport === report.id;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] mb-3 overflow-hidden"
              >
                {/* Report header */}
                <button
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                  className="w-full flex items-center gap-3 p-4"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-surface shrink-0">
                    <img
                      src={report.imageData}
                      alt="InBody"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text-primary">
                      InBody Scan
                    </p>
                    <p className="text-xs text-text-subtle">
                      {new Date(report.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-text-subtle" />
                  ) : (
                    <ChevronDown size={16} className="text-text-subtle" />
                  )}
                </button>

                {/* Expanded analysis */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        {/* Full image */}
                        <div className="rounded-xl overflow-hidden mb-3 border border-border">
                          <img
                            src={report.imageData}
                            alt="InBody Report"
                            className="w-full"
                          />
                        </div>

                        {/* Analysis */}
                        <div className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap mb-3">
                          {report.analysis}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="flex items-center gap-1.5 text-xs text-error"
                        >
                          <Trash2 size={12} />
                          Delete report
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Weight history */}
      {stats.length > 1 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Weight History
          </h3>
          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
            {[...stats].reverse().map((s, i) => (
              <div
                key={s.date}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < stats.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-xs text-text-subtle">
                  {new Date(s.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">
                    {s.weight} kg
                  </span>
                  <span className="text-xs text-text-subtle">
                    BMI {s.bmi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume Trends */}
      <VolumeChart />

      {/* Empty state */}
      {stats.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mx-auto mb-3">
            <Scale size={28} className="text-text-subtle" />
          </div>
          <p className="text-sm text-text-muted">No stats logged yet</p>
          <p className="text-xs text-text-subtle mt-1">
            Log your weight and height to get started
          </p>
        </div>
      )}
    </div>
  );
}

// Compress image to a smaller size for localStorage
async function compressImage(base64: string, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = base64;
  });
}
