import {
  ICON_STROKE,
  ICON_VIEWBOX,
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
 * The mark alone, cropped square the way the app icon is, drawn in
 * `currentColor`. Small sizes get the heavier icon weight because the display
 * weight thins out to a hairline below about 40px.
 */
export function LogoMark({
  size = 24,
  stroke = ICON_STROKE,
  className,
}: {
  size?: number;
  stroke?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={ICON_VIEWBOX}
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <MarkPaths stroke={stroke} />
    </svg>
  );
}

/**
 * The mark on the signature gradient — the app's avatar, matching the home
 * screen icon. The gradient comes from the design system rather than an SVG
 * `<linearGradient>` so there is no generated id to collide with.
 */
export function LogoTile({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`grad-primary overflow-hidden shrink-0 ${className}`}
      // Corner radius in proportion to the tile, so it keeps the squircle of
      // the home screen icon at every size instead of rounding to a circle.
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <LogoMark size={size} className="text-[#0B0B10]" />
    </div>
  );
}

/**
 * Mark plus lettering, in the artwork's original proportions. The lettering
 * only resolves above roughly 120px wide, so this is for entry screens rather
 * than chrome.
 */
export function LogoLockup({
  width = 220,
  className,
}: {
  width?: number;
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
      <MarkPaths stroke={MARK_STROKE} />
      <g transform={WORDMARK_TRANSFORM}>
        <path d={WORDMARK_D} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  );
}
