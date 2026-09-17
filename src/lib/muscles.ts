/**
 * Muscle taxonomy + the vector geometry for the interactive body map.
 *
 * The figure is drawn in a 200 x 430 viewBox. Everything is modelled on the
 * right half of the body (x >= 100) and mirrored at render time, so the figure
 * is symmetric by construction. Muscle shapes are clipped to the silhouette,
 * which means a shape can be drawn generously without spilling outside the body.
 */

export type MuscleId =
  | "chest"
  | "front-delts"
  | "side-delts"
  | "rear-delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "traps"
  | "lats"
  | "upper-back"
  | "lower-back"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export type BodyView = "front" | "back";

export interface MuscleGroup {
  id: MuscleId;
  label: string;
  /** Short label used where space is tight (chips, tooltips). */
  short: string;
  /** Which of the two views this muscle is actually visible on. */
  views: BodyView[];
  /** Weekly hard-set target used by the "what should I hit" suggestions. */
  weeklySetTarget: number;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", label: "Chest", short: "Chest", views: ["front"], weeklySetTarget: 12 },
  { id: "front-delts", label: "Front Delts", short: "F. Delts", views: ["front"], weeklySetTarget: 8 },
  { id: "side-delts", label: "Side Delts", short: "S. Delts", views: ["front", "back"], weeklySetTarget: 10 },
  { id: "rear-delts", label: "Rear Delts", short: "R. Delts", views: ["back"], weeklySetTarget: 10 },
  { id: "biceps", label: "Biceps", short: "Biceps", views: ["front"], weeklySetTarget: 10 },
  { id: "triceps", label: "Triceps", short: "Triceps", views: ["back"], weeklySetTarget: 10 },
  { id: "forearms", label: "Forearms", short: "Forearms", views: ["front", "back"], weeklySetTarget: 6 },
  { id: "abs", label: "Abs", short: "Abs", views: ["front"], weeklySetTarget: 10 },
  { id: "obliques", label: "Obliques", short: "Obliques", views: ["front"], weeklySetTarget: 6 },
  { id: "traps", label: "Traps", short: "Traps", views: ["front", "back"], weeklySetTarget: 8 },
  { id: "lats", label: "Lats", short: "Lats", views: ["back"], weeklySetTarget: 12 },
  { id: "upper-back", label: "Upper Back", short: "Up. Back", views: ["back"], weeklySetTarget: 10 },
  { id: "lower-back", label: "Lower Back", short: "Lo. Back", views: ["back"], weeklySetTarget: 6 },
  { id: "glutes", label: "Glutes", short: "Glutes", views: ["back"], weeklySetTarget: 10 },
  { id: "quads", label: "Quads", short: "Quads", views: ["front"], weeklySetTarget: 12 },
  { id: "hamstrings", label: "Hamstrings", short: "Hams", views: ["back"], weeklySetTarget: 10 },
  { id: "calves", label: "Calves", short: "Calves", views: ["front", "back"], weeklySetTarget: 8 },
];

export const MUSCLE_BY_ID: Record<MuscleId, MuscleGroup> = Object.fromEntries(
  MUSCLE_GROUPS.map((m) => [m.id, m])
) as Record<MuscleId, MuscleGroup>;

export function muscleLabel(id: MuscleId): string {
  return MUSCLE_BY_ID[id]?.label ?? id;
}

/** Muscles shown on a given view, in roughly head-to-toe order. */
export function musclesForView(view: BodyView): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((m) => m.views.includes(view));
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export const BODY_VIEWBOX = { width: 200, height: 430 };

/** A drawable region. `mirror: true` means "also draw the x-mirrored copy". */
export interface Region {
  d: string;
  mirror: boolean;
}

/**
 * Body outline, drawn beneath the muscles in a neutral fill and re-used as the
 * clip path so no muscle shape can bleed past the edge of the figure.
 */
export const SILHOUETTE: Region[] = [
  // Head
  { d: "M100 8 C112 8 121 18 121 31 C121 44 112 53 100 53 C88 53 79 44 79 31 C79 18 88 8 100 8 Z", mirror: false },
  // Neck
  { d: "M89 46 L111 46 L113 68 L87 68 Z", mirror: false },
  // Torso
  {
    d:
      "M100 60 L118 63 C131 66 141 73 144 85 L140 132 " +
      "C138 152 134 170 128 184 L126 202 L129 223 L100 223 " +
      "L71 223 L74 202 L72 184 C66 170 62 152 60 132 " +
      "L56 85 C59 73 69 66 82 63 Z",
    mirror: false,
  },
  // Arm: upper arm, forearm and hand, mirrored for the other side
  {
    d:
      "M130 70 C145 73 154 88 155 107 C156 125 158 143 161 161 " +
      "C164 179 166 199 164 215 C163 226 159 234 153 234 " +
      "C147 234 144 226 143 215 C141 199 138 179 135 161 " +
      "C132 143 129 125 128 107 C127 88 124 72 130 70 Z",
    mirror: true,
  },
  // Leg: thigh, shin and ankle, mirrored
  {
    d:
      "M101 210 L130 210 C135 244 132 286 124 314 " +
      "C128 344 123 386 119 404 L118 418 L102 418 L103 404 " +
      "C100 378 102 344 105 314 C99 286 99 244 101 210 Z",
    mirror: true,
  },
  // Foot, mirrored
  { d: "M102 412 L119 412 C123 412 126 416 126 420 L126 425 L100 425 L100 418 Z", mirror: true },
];

/** Muscle shapes for the front view. */
export const FRONT_REGIONS: Partial<Record<MuscleId, Region[]>> = {
  traps: [{ d: "M101 57 L133 77 L127 90 L101 83 Z", mirror: true }],
  "front-delts": [
    {
      d: "M126 75 C139 77 148 88 149 102 C149 112 141 116 134 110 C126 102 122 84 126 75 Z",
      mirror: true,
    },
  ],
  "side-delts": [
    {
      d: "M140 80 C152 87 158 100 157 114 C156 123 148 126 143 119 C137 110 136 92 140 80 Z",
      mirror: true,
    },
  ],
  chest: [
    {
      d: "M103 85 C114 84 123 86 130 91 C139 98 140 110 133 118 C125 126 111 126 103 122 Z",
      mirror: true,
    },
  ],
  abs: [
    {
      d: "M86 128 L114 128 L115 180 C115 194 108 203 100 207 C92 203 85 194 85 180 Z",
      mirror: false,
    },
  ],
  obliques: [
    {
      d: "M116 131 L130 139 C132 158 127 180 116 196 L114 172 Z",
      mirror: true,
    },
  ],
  biceps: [
    {
      d: "M131 104 C145 104 154 117 155 134 C156 148 151 158 144 158 C137 157 132 145 131 127 Z",
      mirror: true,
    },
  ],
  forearms: [
    {
      d: "M138 163 C151 163 159 177 162 196 C164 212 162 227 154 228 C147 229 143 214 141 196 Z",
      mirror: true,
    },
  ],
  quads: [
    {
      d: "M103 216 L129 214 C134 246 131 284 123 309 L106 309 C101 277 101 245 103 216 Z",
      mirror: true,
    },
  ],
  calves: [
    {
      d: "M107 322 L124 322 C127 350 122 382 115 398 L107 398 C104 369 104 345 107 322 Z",
      mirror: true,
    },
  ],
};

/** Muscle shapes for the back view. */
export const BACK_REGIONS: Partial<Record<MuscleId, Region[]>> = {
  traps: [{ d: "M101 56 L136 79 L131 97 L101 97 Z", mirror: true }],
  "rear-delts": [
    {
      d: "M127 75 C141 78 150 90 150 105 C150 115 142 119 135 113 C127 105 123 85 127 75 Z",
      mirror: true,
    },
  ],
  "side-delts": [
    {
      d: "M142 82 C154 89 159 101 158 115 C157 124 149 127 144 120 C138 111 138 94 142 82 Z",
      mirror: true,
    },
  ],
  "upper-back": [{ d: "M102 99 L129 97 L125 127 L102 127 Z", mirror: true }],
  lats: [
    {
      d: "M130 99 C141 114 140 148 123 174 L104 157 L104 129 L126 129 Z",
      mirror: true,
    },
  ],
  "lower-back": [
    {
      d: "M87 159 L113 159 L115 183 C113 193 106 198 100 198 C94 198 87 193 85 183 Z",
      mirror: false,
    },
  ],
  triceps: [
    {
      d: "M131 103 C145 103 155 118 156 136 C157 151 152 160 145 160 C137 160 132 147 130 128 Z",
      mirror: true,
    },
  ],
  forearms: [
    {
      d: "M138 164 C151 164 159 178 162 197 C164 213 162 228 154 229 C147 230 143 215 141 197 Z",
      mirror: true,
    },
  ],
  glutes: [
    {
      d: "M101 194 L127 192 C136 201 137 225 125 234 C112 242 102 235 101 219 Z",
      mirror: true,
    },
  ],
  hamstrings: [
    {
      d: "M104 240 L128 238 C130 268 126 295 120 311 L106 311 C103 284 103 260 104 240 Z",
      mirror: true,
    },
  ],
  calves: [
    {
      d: "M106 322 L125 322 C129 348 123 382 115 400 L107 400 C104 370 104 345 106 322 Z",
      mirror: true,
    },
  ],
};

/**
 * Painting order for the overlay. Deep/large muscles go down first so the
 * detail sitting on top of them (lats over the rhomboids, delts over the
 * traps) stays visible.
 */
export const PAINT_ORDER: MuscleId[] = [
  "traps",
  "upper-back",
  "lats",
  "lower-back",
  "chest",
  "abs",
  "obliques",
  "front-delts",
  "rear-delts",
  "side-delts",
  "biceps",
  "triceps",
  "forearms",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
];

export function regionsForView(view: BodyView): Partial<Record<MuscleId, Region[]>> {
  return view === "front" ? FRONT_REGIONS : BACK_REGIONS;
}
