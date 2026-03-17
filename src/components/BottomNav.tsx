"use client";

import { Dumbbell, ExternalLink, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: "training";
  onTabChange: (tab: "training") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {/* Training tab */}
        <button
          onClick={() => onTabChange("training")}
          className="relative flex flex-col items-center py-3 px-6 gap-1.5"
        >
          <div className="relative">
            {activeTab === "training" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-[-6px] bg-accent rounded-xl"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Dumbbell
              size={20}
              className="relative z-10 text-bg-primary"
              strokeWidth={2.5}
            />
          </div>
          <span className="text-[10px] font-medium text-text-primary">
            Training
          </span>
        </button>

        {/* InBody link */}
        <a
          href="https://apps.apple.com/us/app/inbody/id884923678"
          className="relative flex flex-col items-center py-3 px-6 gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-blue/15 flex items-center justify-center">
            <Activity size={16} className="text-blue" />
          </div>
          <span className="text-[10px] font-medium text-text-subtle">
            InBody
          </span>
        </a>

        {/* HealthifyMe link */}
        <a
          href="hmein://activity/DashboardActivity"
          className="relative flex flex-col items-center py-3 px-6 gap-1.5"
        >
          <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center">
            <ExternalLink size={16} className="text-success" />
          </div>
          <span className="text-[10px] font-medium text-text-subtle">
            Healthify
          </span>
        </a>
      </div>
    </nav>
  );
}
