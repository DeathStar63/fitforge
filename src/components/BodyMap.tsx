"use client";

import { Fragment, memo, useId } from "react";
import { motion } from "framer-motion";
import {
  BODY_VIEWBOX,
  SILHOUETTE,
  regionsForView,
  LABEL_ANCHORS,
  PAINT_ORDER,
  muscleLabel,
  type BodyView,
  type MuscleId,
  type Region,
} from "@/lib/muscles";
import {
  MUSCLE_STATE_COLORS,
  type MuscleState,
  type MuscleStatusMap,
} from "@/lib/muscleStatus";

/** [top stop, bottom stop] per state. */
const STATE_GRADIENTS: Record<MuscleState | "none", [string, string]> = {
  // Lime for trained, warm amber for recovered, and plain grey for dormant.
  // "You have not trained this in five days" does not deserve an alarm colour
  // on a dozen muscles at once, and grey lets the trained ones lead the eye.
  worked: ["#E2FA5B", "#93B81C"],
  ready: ["#FBBF24", "#B45309"],
  due: ["#4C505C", "#31343D"],
  none: ["#3E414B", "#282B33"],
};

interface BodyMapProps {
  view: BodyView;
  statuses?: MuscleStatusMap;
  selected?: MuscleId[];
  /** Muscles to outline as "this is what today's workout hits". */
  highlighted?: MuscleId[];
  onToggleMuscle?: (muscle: MuscleId) => void;
  /** Rendered at a smaller size with no interaction, for use inside cards. */
  compact?: boolean;
  /** Draw a name callout beside each selected muscle. */
  showLabels?: boolean;
  className?: string;
}

/** Callout geometry, in viewBox units. */
const LABEL_GUTTER = 96; // extra width on the right for the name column
const LABEL_X = BODY_VIEWBOX.width + 16; // where the text sits
const LABEL_MIN_GAP = 21; // smallest vertical gap between two stacked labels

/** Untrained muscle and the body itself, as gradient stops. */
const SILHOUETTE_TOP = "#1E2029";
const SILHOUETTE_BOTTOM = "#101219";
const NEUTRAL_STROKE = "rgba(255,255,255,0.10)";
/** Separator between neighbouring muscles — without it, a row of muscles in
 *  the same state reads as one undifferentiated blob. */
const SEPARATOR = "#08080C";

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
  showLabels = false,
  className = "",
}: BodyMapProps) {
  // useId keeps the clipPath unique when several maps are on screen at once.
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `body-clip-${view}-${rawId}`;
  const regions = regionsForView(view);
  const selectedSet = new Set(selected);
  const highlightedSet = new Set(highlighted);
  const interactive = Boolean(onToggleMuscle) && !compact;

  // Callouts for the selected muscles that this view actually shows. Sorted
  // head-to-toe, then pushed apart so two labels never overlap.
  const anchors = LABEL_ANCHORS[view];
  const callouts = showLabels
    ? selected
        .filter((id) => regions[id] && anchors[id])
        .map((id) => ({ id, anchor: anchors[id]! }))
        .sort((a, b) => a.anchor.y - b.anchor.y)
        .map((c, i, all) => {
          // Walk down the stack, nudging each label below the previous one.
          const prev = i > 0 ? all[i - 1] : null;
          const y = prev
            ? Math.max(c.anchor.y, (prev as typeof c & { labelY: number }).labelY + LABEL_MIN_GAP)
            : c.anchor.y;
          (c as typeof c & { labelY: number }).labelY = y;
          return c as typeof c & { labelY: number };
        })
    : [];

  const viewBox = showLabels
    ? `0 0 ${BODY_VIEWBOX.width + LABEL_GUTTER} ${BODY_VIEWBOX.height}`
    : `0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`;

  return (
    <svg
      viewBox={viewBox}
      className={`w-full h-full ${className}`}
      role="img"
      aria-label={`${view === "front" ? "Front" : "Back"} view muscle map`}
    >
      <defs>
        <clipPath id={clipId}>
          <RegionPaths regions={SILHOUETTE} />
        </clipPath>

        {/* The body itself, lit from above */}
        <linearGradient id={`${clipId}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SILHOUETTE_TOP} />
          <stop offset="100%" stopColor={SILHOUETTE_BOTTOM} />
        </linearGradient>

        {/* One gradient per state, plus the unknown/neutral case. Flat fills
            made neighbouring muscles in the same state merge into one blob;
            a gradient gives each shape its own highlight and shadow. */}
        {(Object.keys(STATE_GRADIENTS) as (MuscleState | "none")[]).map((key) => {
          const [from, to] = STATE_GRADIENTS[key];
          return (
            <linearGradient
              key={key}
              id={`${clipId}-${key}`}
              x1="0"
              y1="0"
              x2="0.35"
              y2="1"
            >
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          );
        })}

        {/* Soft bloom behind the fills, so a trained muscle reads as lit
            rather than painted. */}
        <filter id={`${clipId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* Body outline */}
      <g>
        <RegionPaths
          regions={SILHOUETTE}
          fill={`url(#${clipId}-body)`}
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
            ? `url(#${clipId}-${status.state})`
            : isHighlighted
              ? "#60A5FA"
              : `url(#${clipId}-none)`;
          const opacity = isSelected || isHighlighted ? 1 : status ? 1 : 0.85;
          // Bloom only where there is something to celebrate, and on whatever
          // is selected — glowing all 21 at once is just noise.
          const lit = isSelected || status?.state === "worked";

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
                filter={lit ? `url(#${clipId}-glow)` : undefined}
                stroke={isSelected ? "#FFFFFF" : SEPARATOR}
                // A heavy outline on every selection turns a dozen picks into
                // armour plating; the callout already names what is selected,
                // so the outline only has to read as "this one".
                strokeWidth={isSelected ? 1.5 : 0.9}
                strokeOpacity={isSelected ? 0.95 : 0.7}
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
              stroke="#DCF64F"
              strokeWidth={1.5}
              strokeDasharray="3.5 3"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* Name callouts for the current selection */}
      {callouts.length > 0 && (
        <g pointerEvents="none">
          {callouts.map(({ id, anchor, labelY }) => {
            const status = statuses?.[id];
            const color = status ? MUSCLE_STATE_COLORS[status.state] : "#62655F";
            const elbowX = BODY_VIEWBOX.width + 4;
            return (
              <motion.g
                key={id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* Leader: out from the muscle, then a short horizontal run
                    into the text so the type always sits on a flat line. */}
                <path
                  d={`M${anchor.x} ${anchor.y} L${elbowX - 10} ${labelY} L${elbowX} ${labelY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.1}
                  strokeOpacity={0.55}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={anchor.x} cy={anchor.y} r={2.4} fill={color} />
                <text
                  x={LABEL_X}
                  y={labelY}
                  dominantBaseline="middle"
                  fill="#F4F5F0"
                  fontSize={12}
                  fontWeight={600}
                  letterSpacing="-0.01em"
                >
                  {muscleLabel(id)}
                </text>
              </motion.g>
            );
          })}
        </g>
      )}

      {/* Transparent hit targets on top — muscle fills are thin in places and
          a bare fill is fiddly to tap on a phone. The stroke that widens them
          stays narrow: at 10 units the delts swallowed the traps and the pec,
          because each region grows by half the stroke in every direction. */}
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
                  strokeWidth={3}
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
