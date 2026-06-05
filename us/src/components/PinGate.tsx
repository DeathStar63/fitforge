"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SESSION_KEY = "us-unlocked";

export default function PinGate({
  pin,
  children,
}: {
  pin: string;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [shake, setShake] = useState(false);
  const [ready, setReady] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check sessionStorage on mount so she doesn't re-enter on refresh.
  useEffect(() => {
    // Client-only: check sessionStorage after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  const check = (d: string[]) => {
    if (d.join("") === pin) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setTimeout(() => setUnlocked(true), 300);
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setDigits(Array(6).fill(""));
        inputsRef.current[0]?.focus();
      }, 600);
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (digits[i]) {
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        next[i - 1] = "";
        setDigits(next);
        inputsRef.current[i - 1]?.focus();
      }
    }
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
    if (next.every((d) => d !== "") && next[i] !== "") {
      check(next);
    }
  };

  if (!ready) return null;

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FBF5F2] px-8">
      <motion.div
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Heart */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#E8A0AE">
            <path d="M12 21s-7.5-4.7-10-9.2C.6 9 1.6 5.6 4.7 4.7 7 4 9 5 12 8c3-3 5-4 7.3-3.3C22.4 5.6 23.4 9 22 11.8 19.5 16.3 12 21 12 21z" />
          </svg>
        </motion.div>

        <div className="text-center">
          <h1 className="font-serif text-[26px] text-[#4A3A35]">
            enter our code
          </h1>
          <p className="mt-2 text-[14px] text-[#A98F88]">
            6 digits, just for you
          </p>
        </div>

        {/* 6 digit boxes */}
        <div className="flex gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={d}
              autoFocus={i === 0}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onFocus={(e) => e.target.select()}
              className="h-14 w-11 rounded-2xl border text-center text-[22px] font-semibold outline-none transition-all duration-200 caret-transparent"
              style={{
                borderColor: d ? "#D98B9B" : "#EBD8D2",
                background: d ? "#FBEAEC" : "#fff",
                color: "#4A3A35",
                boxShadow: d
                  ? "0 4px 12px rgba(217,139,155,0.2)"
                  : "0 2px 6px rgba(0,0,0,0.04)",
              }}
            />
          ))}
        </div>

        <AnimatePresence>
          {shake && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[13px] text-[#C06B7C]"
            >
              try again
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
