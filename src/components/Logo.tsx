import {
  LOGO_BOX,
  MARK_OUTLINE_D,
  MARK_PLANES_D,
  MARK_SPINE_D,
  MARK_STROKE,
  WORDMARK_D,
  WORDMARK_TRANSFORM,
} from "@/lib/logo";

/** The mark's own geometry — shared by every rendering below. */
function MarkPaths({ stroke }: { stroke: number }) {
  return (
    <>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="miter"
        strokeLinecap="butt"
        strokeMiterlimit={8}
      >
        <path d={MARK_OUTLINE_D} />
        <path d={MARK_SPINE_D} />
      </g>
      <g fill="currentColor">
        {MARK_PLANES_D.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </>
  );
}

/**
 * The launcher icon, reproduced in the app: the full lockup on the signature
 * gradient. The gradient comes from the design system rather than an SVG
 * `<linearGradient>` so there is no generated id to collide with, and the
 * corner radius is in proportion to the tile so it keeps the home screen
 * squircle at every size.
 */
export function LogoTile({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`grad-primary overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <LogoLockup width={Math.round(size * 0.88)} stroke={26} className="text-[#0B0B10]" />
    </div>
  );
}

/**
 * Mark plus lettering, in the artwork's original proportions. The lettering
 * reads down to roughly 60px wide and turns to texture below that.
 */
export function LogoLockup({
  width = 220,
  stroke = MARK_STROKE,
  className,
}: {
  width?: number;
  /** Heavier than the artwork's own weight where the lockup is drawn small. */
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={Math.round((width * LOGO_BOX.h) / LOGO_BOX.w)}
      viewBox={`0 0 ${LOGO_BOX.w} ${LOGO_BOX.h}`}
      className={className}
      role="img"
      aria-label="FitForge"
    >
      <MarkPaths stroke={stroke} />
      <g transform={WORDMARK_TRANSFORM}>
        <path d={WORDMARK_D} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  );
}
