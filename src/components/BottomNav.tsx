"use client";

import { Dumbbell, TrendingUp, ExternalLink, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: "training" | "progress";
  onTabChange: (tab: "training" | "progress") => void;
}

const tabs = [
  { id: "training" as const, label: "Training", icon: Dumbbell },
  { id: "progress" as const, label: "Progress", icon: TrendingUp },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center py-3 px-6 gap-1.5"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-[-6px] bg-accent rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon
                  size={20}
                  className={`relative z-10 ${
                    isActive ? "text-bg-primary" : "text-text-subtle"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-text-primary" : "text-text-subtle"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

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
