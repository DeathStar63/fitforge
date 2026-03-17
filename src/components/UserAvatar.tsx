"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UserAvatar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = user?.email?.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center"
      >
        <span className="text-xs font-semibold text-text-muted">{initial}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-60 bg-bg-card rounded-xl border border-border shadow-[var(--shadow-card-lg)] overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-text-subtle shrink-0" />
                <p className="text-xs text-text-muted truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
