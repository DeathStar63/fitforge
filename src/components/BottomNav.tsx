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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="glass rounded-[24px] flex items-stretch px-1.5 py-1.5 shadow-[var(--shadow-card-lg)] pointer-events-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className="relative flex-1 flex flex-col items-center py-2 gap-1 rounded-[18px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-[19px] grad-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <tab.icon
                size={20}
                className={`relative z-10 ${
                  isActive ? "text-[#14151A]" : "text-text-subtle"
                }`}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <span
                className={`relative z-10 text-[10.5px] font-semibold tracking-tight ${
                  isActive ? "text-[#14151A]" : "text-text-subtle"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
