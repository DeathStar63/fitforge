"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, X, Plus, Download } from "lucide-react";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (isStandalone) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem("fitforge_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Show again after 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Small delay so it doesn't flash on load
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("fitforge_install_dismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto mb-[env(safe-area-inset-bottom)]"
        >
          <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-[var(--shadow-card-lg)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Download size={18} className="text-bg-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  Install FitForge
                </p>
                {isIOS ? (
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Tap <Share size={12} className="inline text-blue" /> <span className="font-medium">Share</span> in Safari, then tap <Plus size={12} className="inline" /> <span className="font-medium">Add to Home Screen</span>
                  </p>
                ) : (
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Tap the browser menu, then <span className="font-medium">Add to Home Screen</span>
                  </p>
                )}
              </div>
              <button
                onClick={dismiss}
                className="p-1 text-text-subtle shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
