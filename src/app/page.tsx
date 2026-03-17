"use client";

import { useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import TrainingTab from "@/components/TrainingTab";
import InstallPrompt from "@/components/InstallPrompt";
import AuthScreen from "@/components/AuthScreen";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";

// Lazy load ProgressTab — it pulls in recharts which is heavy (~200kb)
const ProgressTab = lazy(() => import("@/components/ProgressTab"));

function ProgressFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-xl bg-bg-surface animate-pulse" />
    </div>
  );
}

type Tab = "training" | "progress";

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("training");

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center animate-pulse">
          <span className="text-bg-primary text-xl font-black">F</span>
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
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-bg-primary text-sm font-black">F</span>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            FitForge
          </span>
        </div>
        <UserAvatar />
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
          {activeTab === "training" && <TrainingTab />}
          {activeTab === "progress" && (
            <Suspense fallback={<ProgressFallback />}>
              <ProgressTab />
            </Suspense>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Install prompt */}
      <InstallPrompt />

      {/* Bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
