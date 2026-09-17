"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import BodyMap from "./BodyMap";
import { getLibraryExercise } from "@/lib/exerciseLibrary";

/**
 * The exercise animation, with a useful fallback.
 *
 * Not every exercise in the library ships with an animation, and a hotlinked
 * GIF can fail to load. Rather than an empty box, fall back to the body map
 * with this exercise's muscles lit up — which is the information the GIF was
 * there to convey in the first place. A GIF can be attached per exercise in
 * the plan editor.
 */
export default function ExerciseGif({
  exerciseId,
  name,
  gifUrl,
}: {
  exerciseId: string;
  name: string;
  gifUrl?: string;
}) {
  // Remember which URL failed rather than a bare boolean, so swapping in a new
  // GIF retries automatically instead of staying stuck on the fallback.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = Boolean(gifUrl) && failedUrl === gifUrl;

  if (gifUrl && !failed) {
    return (
      <div className="mb-3 rounded-xl overflow-hidden bg-bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gifUrl}
          alt={name}
          width={320}
          height={160}
          className="w-full h-40 object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(gifUrl ?? null)}
        />
      </div>
    );
  }

  const lib = getLibraryExercise(exerciseId);
  const primary = lib?.primary ?? [];
  const secondary = lib?.secondary ?? [];

  return (
    <div className="mb-3 rounded-xl overflow-hidden bg-bg-surface px-3 py-2">
      <div className="flex items-center justify-center gap-4 h-32">
        {(["front", "back"] as const).map((view) => (
          <div key={view} className="h-full">
            <BodyMap view={view} highlighted={primary} selected={secondary} compact />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-text-subtle text-center flex items-center justify-center gap-1 pb-1">
        <ImageOff size={10} />
        {failed
          ? "Animation failed to load — add your own in Plan"
          : "No animation yet — add a GIF link in Plan"}
      </p>
    </div>
  );
}
