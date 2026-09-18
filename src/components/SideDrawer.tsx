"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Cloud,
  ExternalLink,
  LogOut,
  Plus,
  RefreshCw,
  Share,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { LogoTile } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useSync } from "@/context/SyncContext";
import { usePlan } from "@/context/PlanContext";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenPlan: () => void;
}

/** "3 minutes ago" for the sync row, without pulling in a date library. */
function relativeTime(iso: string | null): string {
  if (!iso) return "Not synced yet";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Not synced yet";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "Synced just now";
  if (mins < 60) return `Synced ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Synced ${hrs}h ago`;
  return `Synced ${Math.floor(hrs / 24)}d ago`;
}

export default function SideDrawer({ open, onClose, onOpenPlan }: SideDrawerProps) {
  const { user, signOut } = useAuth();
  const { triggerFullSync, lastSync } = useSync();
  const { plan } = usePlan();
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(lastSync);
  const [installable, setInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Close on Escape, and stop the page behind from scrolling while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    setInstallable(!standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const runSync = async () => {
    setSyncing(true);
    try {
      await triggerFullSync();
      setSyncedAt(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  };

  const scheduledDays = plan.days.filter(Boolean).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 500) onClose();
            }}
            className="fixed top-0 right-0 bottom-0 z-[86] w-[82%] max-w-[320px] glass border-y-0 border-r-0 flex flex-col"
          >
            <div className="h-[env(safe-area-inset-top)]" />

            {/* Account */}
            <div className="px-4 pt-4 pb-4 border-b border-border flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl grad-primary flex items-center justify-center shrink-0 shadow-[var(--glow-primary)]">
                <span className="text-[#14151A] text-base font-black">
                  {user?.email?.charAt(0).toUpperCase() || "F"}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.email?.split("@")[0] || "FitForge"}
                </p>
                <p className="text-[11px] text-text-subtle truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center shrink-0"
                aria-label="Close menu"
              >
                <X size={15} className="text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {/* Plan */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPlan();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-bg-surface transition-colors text-left"
              >
                <span className="w-9 h-9 rounded-xl bg-accent/12 flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={16} className="text-accent" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-primary">
                    Your Plan
                  </span>
                  <span className="block text-[11px] text-text-subtle">
                    {plan.routines.length} workouts · {scheduledDays} days a week
                  </span>
                </span>
              </button>

              {/* Sync */}
              <button
                onClick={runSync}
                disabled={syncing}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-bg-surface transition-colors text-left disabled:opacity-60"
              >
                <span className="w-9 h-9 rounded-xl bg-blue/12 flex items-center justify-center shrink-0">
                  {syncing ? (
                    <RefreshCw size={16} className="text-blue animate-spin" />
                  ) : (
                    <Cloud size={16} className="text-blue" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-primary">
                    {syncing ? "Syncing…" : "Sync now"}
                  </span>
                  <span className="block text-[11px] text-text-subtle">
                    {relativeTime(syncedAt)}
                  </span>
                </span>
              </button>

              <div className="h-px bg-border my-3 mx-3" />

              <p className="px-3 pb-1.5 text-[10px] uppercase tracking-wider text-text-subtle">
                Companion apps
              </p>

              <a
                href="https://apps.apple.com/us/app/inbody/id884923678"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-bg-surface transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-blue/12 flex items-center justify-center shrink-0">
                  <Activity size={16} className="text-blue" />
                </span>
                <span className="flex-1 text-sm font-medium text-text-primary">
                  InBody
                </span>
                <ExternalLink size={13} className="text-text-subtle shrink-0" />
              </a>

              <a
                href="hmein://activity/DashboardActivity"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-bg-surface transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-success/12 flex items-center justify-center shrink-0">
                  <ExternalLink size={16} className="text-success" />
                </span>
                <span className="flex-1 text-sm font-medium text-text-primary">
                  HealthifyMe
                </span>
                <ExternalLink size={13} className="text-text-subtle shrink-0" />
              </a>

              {/* Install — used to be a floating card that sat on top of the
                  content on every screen. */}
              {installable && (
                <>
                  <div className="h-px bg-border my-3 mx-3" />
                  <div className="px-3 py-3 rounded-2xl bg-bg-surface">
                    {/* The real icon, so it is obvious what lands on the
                        home screen */}
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <LogoTile size={40} />
                      <p className="text-sm font-medium text-text-primary">
                        Install FitForge
                      </p>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {isIOS ? (
                        <>
                          Tap <Share size={11} className="inline text-blue" />{" "}
                          <span className="font-medium">Share</span> in Safari,
                          then <Plus size={11} className="inline" />{" "}
                          <span className="font-medium">Add to Home Screen</span>
                        </>
                      ) : (
                        <>
                          Open the browser menu, then{" "}
                          <span className="font-medium">Add to Home Screen</span>
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Sign out */}
            <div className="px-3 pb-3 border-t border-border pt-3">
              <button
                onClick={async () => {
                  onClose();
                  await signOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-error/5 transition-colors text-left"
              >
                <span className="w-9 h-9 rounded-xl bg-error/12 flex items-center justify-center shrink-0">
                  <LogOut size={15} className="text-error" />
                </span>
                <span className="text-sm font-medium text-error">Sign out</span>
              </button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
