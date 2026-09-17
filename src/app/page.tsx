"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import BottomNav, { type NavTab } from "@/components/BottomNav";
import TrainingTab from "@/components/TrainingTab";
import SideDrawer from "@/components/SideDrawer";
import AuthScreen from "@/components/AuthScreen";
import { useAuth } from "@/context/AuthContext";

// Lazy load heavy tabs — they pull in recharts which is heavy (~200kb)
const ProgressTab = lazy(() => import("@/components/ProgressTab"));
const StatsTab = lazy(() => import("@/components/StatsTab"));
// The body map and plan editor pull in the whole exercise library
const BodyTab = lazy(() => import("@/components/BodyTab"));
const PlanEditor = lazy(() => import("@/components/PlanEditor"));

function ProgressFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-xl bg-bg-surface animate-pulse" />
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("training");
  const [planOpen, setPlanOpen] = useState(false);
  // An exercise sent from the body map to the plan editor.
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null);
  // A workout the body map asked the training screen to open.
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Each tab is its own screen — arriving part-way down the previous one is
  // disorienting, so start every switch at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-14 h-14 rounded-3xl grad-primary flex items-center justify-center animate-pulse shadow-[var(--glow-primary)]">
          <span className="text-[#14151A] text-xl font-black">F</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen bg-bg-primary max-w-md mx-auto relative">
      {/* Status bar spacer */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* App header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl grad-primary flex items-center justify-center shadow-[var(--glow-primary)]">
            <span className="text-[#14151A] text-sm font-black">F</span>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            FitForge
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-xl surface flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu size={17} className="text-text-muted" />
        </button>
      </header>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "training" && (
            <TrainingTab
              onOpenPlan={() => setPlanOpen(true)}
              openWorkoutId={openWorkoutId}
            />
          )}
          {activeTab === "body" && (
            <Suspense fallback={<ProgressFallback />}>
              <BodyTab
                onAddExercise={(id) => {
                  setPendingExerciseId(id);
                  setPlanOpen(true);
                }}
                onStartWorkout={(workoutId) => {
                  setOpenWorkoutId(workoutId);
                  setActiveTab("training");
                }}
              />
            </Suspense>
          )}
          {activeTab === "progress" && (
            <Suspense fallback={<ProgressFallback />}>
              <ProgressTab />
            </Suspense>
          )}
          {activeTab === "stats" && (
            <Suspense fallback={<ProgressFallback />}>
              <StatsTab />
            </Suspense>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Plan editor */}
      <AnimatePresence>
        {planOpen && (
          <Suspense fallback={null}>
            <PlanEditor
              pendingExerciseId={pendingExerciseId}
              onClose={() => {
                setPlanOpen(false);
                setPendingExerciseId(null);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Menu: account, plan, sync, companion apps, install */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenPlan={() => setPlanOpen(true)}
      />

      {/* Bottom nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          // Leaving training drops the forced selection, so coming back later
          // lands on today's scheduled workout rather than an old quick one.
          if (tab !== "training") setOpenWorkoutId(null);
          setActiveTab(tab);
        }}
      />
    </main>
  );
}
