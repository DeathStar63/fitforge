"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface HeartSpec {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
}

export default function Hearts({ burst = false }: { burst?: boolean }) {
  const count = burst ? 18 : 7;
  const [vh, setVh] = useState(800);
  const [hearts, setHearts] = useState<HeartSpec[]>([]);

  useEffect(() => {
    // Client-only: viewport height + random positions after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVh(window.innerHeight);
    setHearts(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * (burst ? 0.6 : 4),
        duration: 5 + Math.random() * 4,
        size: 12 + Math.random() * 16,
        drift: (Math.random() - 0.5) * 60,
      }))
    );
  }, [count, burst]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute bottom-0"
          style={{ left: `${h.left}%` }}
          initial={{ y: 20, x: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -vh - 40, x: h.drift, opacity: [0, 0.7, 0.7, 0], scale: 1 }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: burst ? 0 : Infinity,
            ease: "easeOut",
          }}
        >
          <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill="#E8A0AE"
            style={{ filter: "drop-shadow(0 1px 2px rgba(200,123,138,0.25))" }}>
            <path d="M12 21s-7.5-4.7-10-9.2C.6 9 1.6 5.6 4.7 4.7 7 4 9 5 12 8c3-3 5-4 7.3-3.3C22.4 5.6 23.4 9 22 11.8 19.5 16.3 12 21 12 21z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
