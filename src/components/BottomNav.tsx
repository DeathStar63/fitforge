"use client";

import {
  Dumbbell,
  TrendingUp,
  BarChart3,
  PersonStanding,
} from "lucide-react";
import { motion } from "framer-motion";

export type NavTab = "training" | "body" | "progress" | "stats";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

/**
 * Four destinations, evenly spread. The InBody and HealthifyMe links used to
 * live here too, which pushed six items into a phone-width bar and squeezed
 * every label down to 10px; they are external apps rather than destinations in
 * this one, so they moved to the side drawer.
 */
const tabs = [
  { id: "training" as const, label: "Training", icon: Dumbbell },
  { id: "body" as const, label: "Body", icon: PersonStanding },
  { id: "progress" as const, label: "Progress", icon: TrendingUp },
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-stretch max-w-md mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className="relative flex-1 flex flex-col items-center py-2.5 gap-1.5"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-[-7px] bg-accent rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon
                  size={21}
                  className={`relative z-10 ${
                    isActive ? "text-bg-primary" : "text-text-subtle"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-text-primary" : "text-text-subtle"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
