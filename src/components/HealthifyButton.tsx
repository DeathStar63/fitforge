"use client";

import { ExternalLink } from "lucide-react";

export default function HealthifyButton() {
  return (
    <a
      href="hmein://activity/DashboardActivity"
      className="fixed z-50 right-4 bottom-20 mb-[env(safe-area-inset-bottom)] flex items-center gap-2 px-4 py-3 bg-success rounded-2xl shadow-[0_4px_16px_rgba(34,197,94,0.3)] active:scale-95 transition-transform"
    >
      <span className="text-white text-sm font-semibold">HealthifyMe</span>
      <ExternalLink size={14} className="text-white/80" />
    </a>
  );
}
