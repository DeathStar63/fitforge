"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Music, VolumeX, Heart, ArrowRight } from "lucide-react";
import { SCENES, STORY_CONFIG, type Scene, type ChoiceOption } from "@/lib/story";
import PhotoFrame from "./PhotoFrame";
import Hearts from "./Hearts";

const ANSWER_PREFIX = "us-story-answer-";

function saveAnswer(key: string, value: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ANSWER_PREFIX + key, value); } catch { /* ignore */ }
}

function loadAnswer(key: string): string {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(ANSWER_PREFIX + key) ?? ""; } catch { return ""; }
}

export default function StoryExperience() {
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;
  const interaction = scene.interaction ?? { kind: "continue" as const };
  const gated = interaction.kind === "choice" || interaction.kind === "input";

  const goNext = useCallback(() => {
    if (isLast) return;
    setIndex((i) => Math.min(i + 1, SCENES.length - 1));
    setInteracted(false);
  }, [isLast]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
    setInteracted(false);
  }, []);

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) { a.pause(); } else { a.play().catch(() => {}); }
    setMusicOn((m) => !m);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#FBF5F2] text-[#5A4A44]">
      {STORY_CONFIG.musicSrc && (
        <audio ref={audioRef} src={STORY_CONFIG.musicSrc} loop preload="auto" />
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <button onClick={goBack} disabled={index === 0} aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#C99BA0] transition disabled:opacity-0">
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {SCENES.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 rounded-full transition-colors duration-500"
              style={{ background: i <= index ? "#E0A2AE" : "#EFDDD8" }} />
          ))}
        </div>
        {STORY_CONFIG.musicSrc && (
          <button onClick={toggleMusic} aria-label={musicOn ? "Mute" : "Play music"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#C99BA0] transition">
            {musicOn ? <Music className="h-4 w-4" strokeWidth={2} /> : <VolumeX className="h-4 w-4" strokeWidth={2} />}
          </button>
        )}
      </div>

      {/* Scene */}
      <div className="relative flex flex-1 flex-col">
        {scene.surprise === "hearts" && <Hearts />}
        <AnimatePresence mode="wait">
          <motion.div key={scene.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-1 flex-col items-center justify-center px-6 py-6">
            <SceneBody scene={scene} />
            <div className="mt-7 w-full max-w-sm">
              <InteractionView scene={scene} onInteracted={() => setInteracted(true)} onAdvance={goNext} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Continue button */}
      {!isLast && interaction.kind !== "finale" && interaction.kind !== "reveal" && (
        <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          <button onClick={goNext} disabled={gated && !interacted}
            className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[#D98B9B] py-3.5 font-medium text-white shadow-[0_6px_20px_rgba(217,139,155,0.35)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none">
            {interaction.kind === "continue" && interaction.label ? interaction.label : "Continue"}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}

function SceneBody({ scene }: { scene: Scene }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center">
      {scene.image && (
        <div className="mb-6 w-full">
          <PhotoFrame src={scene.image} alt={scene.imageAlt} />
        </div>
      )}
      {scene.heading && (
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-[26px] leading-snug text-[#4A3A35]">
          {scene.heading}
        </motion.h1>
      )}
      {scene.body?.map((para, i) => (
        <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 + i * 0.4 }}
          className="mt-4 text-[15px] leading-relaxed text-[#6B5852]">
          {para}
        </motion.p>
      ))}
    </div>
  );
}

function InteractionView({ scene, onInteracted, onAdvance }: {
  scene: Scene; onInteracted: () => void; onAdvance: () => void;
}) {
  const interaction = scene.interaction;
  if (!interaction) return null;
  switch (interaction.kind) {
    case "choice":
      return <ChoiceView prompt={interaction.prompt} options={interaction.options} onPicked={onInteracted} />;
    case "input":
      return <InputView prompt={interaction.prompt} placeholder={interaction.placeholder} storageKey={interaction.storageKey} onTyped={onInteracted} />;
    case "reveal":
      return <RevealView label={interaction.label} hidden={interaction.hidden} onRevealed={onInteracted} onAdvance={onAdvance} />;
    case "finale":
      return <FinaleView signoff={interaction.signoff} />;
    default:
      return null;
  }
}

function ChoiceView({ prompt, options, onPicked }: { prompt: string; options: ChoiceOption[]; onPicked: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[13px] text-[#A98F88]">{prompt}</p>
      <div className="flex w-full flex-col gap-2.5">
        {options.map((opt, i) => (
          <button key={i} onClick={() => { setPicked(i); onPicked(); }}
            className="rounded-2xl border px-4 py-3 text-[15px] font-medium transition active:scale-[0.98]"
            style={{ borderColor: picked === i ? "#D98B9B" : "#EBD8D2", background: picked === i ? "#FBEAEC" : "#FFFFFF", color: picked === i ? "#C06B7C" : "#6B5852" }}>
            {opt.label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {picked !== null && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-center text-[14px] italic text-[#C06B7C]">
            {options[picked].response}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputView({ prompt, placeholder, storageKey, onTyped }: {
  prompt: string; placeholder?: string; storageKey: string; onTyped: () => void;
}) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadAnswer(storageKey);
    if (existing) {
      // Client-only restore from localStorage (avoids hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(existing);
      onTyped();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const handleChange = (v: string) => { setValue(v); setSaved(false); if (v.trim()) onTyped(); };
  const handleSave = () => { saveAnswer(storageKey, value.trim()); setSaved(true); };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[13px] text-[#A98F88]">{prompt}</p>
      <textarea value={value} onChange={(e) => handleChange(e.target.value)} onBlur={handleSave}
        placeholder={placeholder} rows={3}
        className="w-full resize-none rounded-2xl border border-[#EBD8D2] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#5A4A44] outline-none transition placeholder:text-[#C9B5AF] focus:border-[#D98B9B]" />
      <button onClick={handleSave} disabled={!value.trim()}
        className="text-[13px] font-medium text-[#C06B7C] transition disabled:opacity-40">
        {saved ? "Saved ✓" : "Save this"}
      </button>
    </div>
  );
}

function RevealView({ label, hidden, onRevealed, onAdvance }: {
  label: string; hidden: string; onRevealed: () => void; onAdvance: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button key="closed" exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => { setOpen(true); onRevealed(); }}
            className="flex items-center gap-2 rounded-2xl border border-[#EBD8D2] bg-white px-6 py-4 font-medium text-[#C06B7C] shadow-sm transition active:scale-[0.98]">
            <Heart className="h-4 w-4 fill-[#E8A0AE] text-[#E8A0AE]" />
            {label}
          </motion.button>
        ) : (
          <motion.div key="open" initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-[#F0D5D0] bg-[#FFF6F4] px-5 py-5 text-center text-[15px] italic leading-relaxed text-[#7A5F58]">
            {hidden}
          </motion.div>
        )}
      </AnimatePresence>
      {open && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={onAdvance}
          className="flex items-center gap-2 rounded-2xl bg-[#D98B9B] px-6 py-3 font-medium text-white shadow-[0_6px_20px_rgba(217,139,155,0.35)] transition active:scale-[0.98]">
          Continue <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </motion.button>
      )}
    </div>
  );
}

function FinaleView({ signoff }: { signoff?: string }) {
  const [opened, setOpened] = useState(false);
  const [answers, setAnswers] = useState<{ key: string; value: string }[]>([]);

  const open = () => {
    const collected = SCENES.flatMap((s) =>
      s.interaction?.kind === "input"
        ? [{ key: s.interaction.storageKey, value: loadAnswer(s.interaction.storageKey) }]
        : []
    ).filter((a) => a.value);
    setAnswers(collected);
    setOpened(true);
  };

  return (
    <div className="relative flex flex-col items-center gap-5">
      {opened && <Hearts burst />}
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.button key="envelope" exit={{ opacity: 0, scale: 0.9 }} onClick={open}
            className="flex flex-col items-center gap-3">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-24 w-32 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(200,140,130,0.25)]">
              <Heart className="h-9 w-9 fill-[#E8A0AE] text-[#E8A0AE]" />
            </motion.div>
            <span className="text-[13px] font-medium tracking-wide text-[#C06B7C]">Tap to open</span>
          </motion.button>
        ) : (
          <motion.div key="opened" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} className="flex w-full flex-col items-center gap-4">
            {answers.length > 0 && (
              <div className="w-full space-y-2.5">
                {answers.map((a) => (
                  <div key={a.key} className="rounded-2xl border border-[#F0D5D0] bg-[#FFF6F4] px-4 py-3 text-center text-[14px] italic leading-relaxed text-[#7A5F58]">
                    &ldquo;{a.value}&rdquo;
                  </div>
                ))}
              </div>
            )}
            {signoff && <p className="font-serif text-[18px] text-[#C06B7C]">{signoff}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
