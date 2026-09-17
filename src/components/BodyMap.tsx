"use client";

import { Fragment, memo, useId } from "react";
import { motion } from "framer-motion";
import {
  BODY_VIEWBOX,
  SILHOUETTE,
  regionsForView,
  PAINT_ORDER,
  muscleLabel,
  type BodyView,
  type MuscleId,
  type Region,
} from "@/lib/muscles";
import {
  MUSCLE_STATE_COLORS,
  type MuscleStatusMap,
} from "@/lib/muscleStatus";

interface BodyMapProps {
  view: BodyView;
  statuses?: MuscleStatusMap;
  selected?: MuscleId[];
  /** Muscles to outline as "this is what today's workout hits". */
  highlighted?: MuscleId[];
  onToggleMuscle?: (muscle: MuscleId) => void;
  /** Rendered at a smaller size with no interaction, for use inside cards. */
  compact?: boolean;
  className?: string;
}

const NEUTRAL_FILL = "#2A2A3E";
const NEUTRAL_STROKE = "#3A3A52";
/** Separator between neighbouring muscles — without it, a row of muscles in
 *  the same state reads as one undifferentiated blob. */
const SEPARATOR = "#0F0F17";

/**
 * Draws a region plus, when `mirror` is set, its x-flipped twin.
 *
 * Emits bare <path> elements — no wrapper — because these are also used as the
 * children of a <clipPath>, which only accepts shape elements.
 */
function RegionPaths({
  regions,
  ...rest
}: { regions: Region[] } & React.SVGProps<SVGPathElement>) {
  return (
    <>
      {regions.map((r, i) => (
        <Fragment key={i}>
          <path d={r.d} {...rest} />
          {r.mirror && (
            <path
              d={r.d}
              transform={`translate(${BODY_VIEWBOX.width} 0) scale(-1 1)`}
              {...rest}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}

const BodyMap = memo(function BodyMap({
  view,
  statuses,
  selected = [],
  highlighted = [],
  onToggleMuscle,
  compact = false,
  className = "",
}: BodyMapProps) {
  // useId keeps the clipPath unique when several maps are on screen at once.
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `body-clip-${view}-${rawId}`;
  const regions = regionsForView(view);
  const selectedSet = new Set(selected);
  const highlightedSet = new Set(highlighted);
  const interactive = Boolean(onToggleMuscle) && !compact;

  return (
    <svg
      viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}
      className={`w-full h-full ${className}`}
      role="img"
      aria-label={`${view === "front" ? "Front" : "Back"} view muscle map`}
    >
      <defs>
        <clipPath id={clipId}>
          <RegionPaths regions={SILHOUETTE} />
        </clipPath>
      </defs>

      {/* Body outline */}
      <g>
        <RegionPaths
          regions={SILHOUETTE}
          fill={NEUTRAL_FILL}
          stroke={NEUTRAL_STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </g>

      {/* Muscle overlays, clipped so nothing spills outside the figure */}
      <g clipPath={`url(#${clipId})`}>
        {PAINT_ORDER.map((id) => {
          const groupRegions = regions[id];
          if (!groupRegions) return null;

          const status = statuses?.[id];
          const isSelected = selectedSet.has(id);
          const isHighlighted = highlightedSet.has(id);
          // With no history to colour by (the plan editor's preview maps), a
          // highlighted muscle is the only thing worth picking out.
          const fill = status
            ? MUSCLE_STATE_COLORS[status.state]
            : isHighlighted
              ? "#60A5FA"
              : "#4B5563";
          const opacity = isSelected || isHighlighted ? 0.95 : status ? 0.62 : 0.4;

          return (
            <motion.g
              key={id}
              initial={false}
              animate={{ opacity }}
              transition={{ duration: 0.25 }}
              onClick={interactive ? () => onToggleMuscle?.(id) : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              {interactive && <title>{muscleLabel(id)}</title>}
              <RegionPaths
                regions={groupRegions}
                fill={fill}
                stroke={isSelected ? "#F0F0F0" : SEPARATOR}
                strokeWidth={isSelected ? 2.5 : 0.9}
                strokeOpacity={isSelected ? 1 : 0.55}
                strokeLinejoin="round"
              />
            </motion.g>
          );
        })}
      </g>

      {/* Today's-workout outline sits above the fills so it stays readable */}
      <g clipPath={`url(#${clipId})`} pointerEvents="none">
        {PAINT_ORDER.map((id) => {
          if (!highlightedSet.has(id)) return null;
          const groupRegions = regions[id];
          if (!groupRegions) return null;
          return (
            <RegionPaths
              key={id}
              regions={groupRegions}
              fill="none"
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* Transparent hit targets on top — muscle fills are thin in places and
          a bare fill is fiddly to tap on a phone. */}
      {interactive && (
        <g>
          {PAINT_ORDER.map((id) => {
            const groupRegions = regions[id];
            if (!groupRegions) return null;
            return (
              <g
                key={id}
                onClick={() => onToggleMuscle?.(id)}
                style={{ cursor: "pointer" }}
              >
                <RegionPaths
                  regions={groupRegions}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={10}
                />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
});

export default BodyMap;
