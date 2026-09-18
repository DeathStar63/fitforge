# FitForge - Progress Tracker

## Current Status: MVP Complete + V2 Improvements

### Session 1 — 2026-03-17
- [x] Created project documentation (CLAUDE.md, plans.md, tracker.md, decisions.md)
- [x] Scaffolded Next.js 16 + TypeScript + Tailwind CSS 4
- [x] Configured PWA (manifest.json, service worker, SVG icons)
- [x] Set up Supabase client (lib/supabase.ts)
- [x] Built design system (dark theme, lime green accents, custom globals.css)
- [x] Built bottom navigation with 3 tabs (Framer Motion animated)
- [x] Built Training tab — full workout dashboard with Legs/Push/Pull split
  - Exercise cards with expand/collapse, set logging, completion checkboxes
  - Double Progression tracking with "last session" comparison
  - Progressive overload indicators (weight increase suggestions)
  - Day selector pills, progress bar, rest day card
- [x] Built Nutrition tab — AI-powered food tracker
  - Text-based food logging (Gemini parses macros)
  - Camera plate scanning (Gemini Vision)
  - Daily macro summary cards (calories, protein, carbs, fats)
  - Meal history with item breakdown and delete
- [x] Built Stats tab — body transformation tracker
  - Weight, height, age, body fat input
  - BMI auto-calculation with category display
  - Gemini AI transformation analysis
  - Weight history list
- [x] Added Framer Motion animations throughout
  - Page transitions, exercise card animations, progress bar animations
  - Bottom nav active indicator spring animation

### Session 2 — 2026-03-17
- [x] Added proper PNG icons (192px + 512px) for PWA
- [x] Fixed ExerciseDB GIFs — all 27 exercises have real animated GIF URLs
- [x] Added Progress tab with lifting tracker + Recharts line charts
- [x] Performance optimizations (lazy loading, React.memo, service worker caching, preconnect)
- [x] Supabase credentials configured in .env.local
- [x] Gemini API key configured in .env.local
- [x] Supabase cloud sync implemented (lib/sync.ts + SyncContext)
- [x] Auth flow implemented (AuthContext + AuthScreen)

### Session 3 — 2026-03-23
- [x] Added Stats tab to bottom navigation (was built but not wired in)
- [x] Stats tab includes: body stats, BMI, weight chart, InBody reports, volume trends
- [x] VolumeChart shows Legs/Push/Pull volume trends over time
- [x] Updated chart themes from dark to white to match design language
- [x] Lazy-loaded StatsTab for performance
- [x] Updated plans.md to reflect actual completion status

### Session 4 — 2026-04-01
- [x] **Flexible day selection** — removed day-of-week locking, users can pick any workout (Legs/Push/Pull) on any day. Sunday no longer blocks workouts. Orange dot shows scheduled workout as suggestion.
- [x] **Personal best display** — added "Personal Best" (trophy icon, orange) above "Last Session" in every exercise card. Added `getBestSet()` and `getAllWorkoutLogs()` to storage.ts.
- [x] **Exercise swaps:**
  - Legs: Standing Calf Raises → Barbell Hip Thrusts (glutes), Hanging Leg Raises → Decline Crunches
  - Push: Cable Lateral Raises → Front Dumbbell Raises, EZ-Bar Skull Crushers → Cable Overhead Tricep Ext.
  - Pull: Reverse Pec Deck → Single Arm DB Row, Barbell Curls → Dumbbell Bicep Curls, Incline DB Curls → Preacher Curls
- [x] **Stats tab overhaul** — removed body stats form, InBody reports, weight chart, weight history. Replaced with:
  - Weekly overview cards (workouts, sets, volume)
  - Weekly sets progress with expandable Legs/Push/Pull category cards
  - Per-exercise detail: sets completed vs target, best weight, progress bars
  - Horizontal bar chart for individual category drill-down
  - Volume trends with time range selector (1W/1M/3M/All)
- [x] **Apple Health activity section** — steps, active calories, exercise minutes, resting HR with manual logging. Note about native Capacitor wrapper for auto-sync.
- [x] Updated plans.md and tracker.md

### Session 5 — 2026-04-22
- [x] Reconciled documentation drift between CLAUDE.md, tracker.md, and decisions.md
- [x] Updated ADR-004 in decisions.md — now reflects the current clean white theme (#FFFFFF / #1A1A2E dark navy / pastel macro colors) instead of the superseded dark + lime green direction. Original ADR noted as superseded for historical context.
- [x] Confirmed CLAUDE.md design language section is the source of truth for the active design system.
- [x] **Per-exercise kg/lbs toggle** — ExerciseCard now has a small segmented kg/lbs switch that applies to Personal Best, Last Session, and the set weight input. Weights are always stored in kg (canonical); conversion only happens on display and input. Pref persisted per exercise id under `fitforge_unit_prefs` so it's not synced to Supabase (device/gym-local preference).
- [x] Added `kgToLbs`, `lbsToKg`, `formatWeight`, `getUnitPref`, `saveUnitPref` helpers + `WeightUnit` type in `src/lib/storage.ts`.
- [x] **Exercise swap:** Single Arm DB Row → Rear Delt Fly (muscle: Rear Delts, new GIF). Kept `id: "single-arm-db-row"` so all previously-logged sets remain attached to this exercise slot.

### Notes
- Using localStorage for all data (works offline in gym)
- next-pwa removed due to Turbopack incompatibility in Next.js 16; using manual service worker
- Gemini API calls happen client-side (API key in NEXT_PUBLIC env var)
- Apple Health auto-sync requires native iOS wrapper (Capacitor) — manual logging for now
- Session 1-2 tracker entries reference the original dark/lime theme (historically accurate); the white redesign landed in Session 3 (2026-03-23)

### Session 4 — 2026-09-17
- [x] Personal customisation — the weekly split is now user-owned
  - `lib/plan.ts`: routines + a routine-per-weekday assignment in localStorage
  - `context/PlanContext.tsx`: single source of truth, debounced cloud sync
  - `PlanEditor` screen: schedule editor, routine CRUD, exercise reorder,
    per-exercise sets/reps overrides, reset to the default split
  - The built-in Legs / Push / Pull routines keep their ids, so existing
    workout history still resolves
- [x] Interactive muscle map (`lib/muscles.ts` + `BodyMap.tsx`)
  - Hand-built front and back SVG figures, 17 muscle groups, mirrored geometry
  - Colour-coded by recovery state, tappable to select, today's workout outlined
  - Re-used compactly in the routine editor and as the exercise GIF fallback
- [x] Suggestions (`lib/muscleStatus.ts`)
  - Weighted set counting (primary 1.0, secondary 0.5) over a trailing week
  - Ranks muscles by days-since-trained and volume gap vs a weekly target
- [x] Exercise library grown from 27 to 108 (`lib/exerciseLibrary.ts`)
  - Muscle, equipment and group tags on every entry; searchable picker
  - Custom GIF URLs per exercise; muscle-map fallback when none loads
- [x] Progress and Stats charts follow the user's routines instead of a
      hardcoded Legs/Push/Pull trio

### Session 5 — 2026-09-17
- [x] Front/back separation made explicit
  - Each view renders only its own muscles; a selection persists across both
  - The view toggle carries a per-side count, so a selection made on the back
    is not invisible while the front is showing
  - The Selected panel groups by front/back
- [x] Name callouts beside the figure for the current selection
  - `LABEL_ANCHORS` per muscle per view, leader lines, collision-avoiding stack
- [x] Muscle coverage audited and widened: 17 -> 21 groups
  - Added adductors, neck, serratus anterior, tibialis anterior
  - Documented what is deliberately merged (gastroc/soleus, rhomboids,
    brachialis, glute medius) and why
- [x] Exercise library 108 -> 131, with a Neck group and band/smith equipment
      filters in the picker
- [x] Bug: transparent hit targets carried a 10-unit stroke, inflating every
      region by 5 units in each direction — the side delt swallowed the front
      delt, the front delt swallowed the trap and the pec. Narrowed to 3 and
      moved three anchors; all 26 regions across both views now verified

### Session 6 — 2026-09-17
- [x] Start a workout from the body map
  - Select muscles -> "Start workout" -> a proposed session you can tweak
  - `buildSessionForMuscles` in `lib/exerciseLibrary.ts` ranks by directness,
    overlap with the other selected muscles, and specificity
  - The session is written into the plan as a routine with the reserved id
    `quick`, so it syncs, tabs and logs through the existing machinery
- [x] Data-loss fix: workout logs were keyed by date alone, so `saveWorkoutLog`
      overwrote any earlier session that day. Now keyed `date__workoutId`, with
      legacy entries read and re-keyed transparently
  - Verified: two sessions on one day both persist; a seeded legacy log reads
    back, re-keys on save without duplicating, and untouched old entries remain
    visible to the volume and muscle-status readers

### Session 7 — 2026-09-17
- [x] UX pass
  - `SideDrawer`: account, plan, sync (with last-synced time and a manual
    trigger), InBody/HealthifyMe, install guidance. Swipe-to-close, Escape,
    scroll lock behind it
  - Bottom nav 6 -> 4 items. The two external links were navigating out of the
    app from a row meant for destinations, and six targets forced 10px labels
  - `RestTimer`: starts when a set is completed, counts against a wall-clock
    end time, +/- 15s, remembered duration, vibrates on finish
  - Body map gets a sticky "Start workout" bar, so the selection stays
    actionable after scrolling past the suggestions
  - Tab switches scroll to top
  - Deleted `UserAvatar` and `InstallPrompt` — the drawer absorbed both

### Session 8 — 2026-09-17
- [x] Premium visual pass, working from supplied Pinterest/Dribbble references
  - Design system in `globals.css`: near-black base, layered translucent
    surfaces, signature violet->blue gradient, semantic state gradients,
    ambient radial wash, `.surface` / `.surface-sunken` / `.glass` /
    `.btn-primary` / `.ring-gradient` utilities
  - Body map: per-state SVG gradients plus a bloom on trained and selected
    muscles, replacing flat fills that made same-state neighbours merge
  - Bottom nav became a floating frosted pill with a gradient active tab
  - Side drawer became frosted glass
  - Every solid accent button across 7 components moved to one gradient
    treatment; inputs became sunken wells
  - Charts: replaced leftover white-theme colours (white tooltips, light grid
    lines) that predate the dark redesign
  - Added a reduced-motion media query

### Session 9 — 2026-09-17
- [x] App icon
  - `scripts/generate-icons.mjs` (`npm run icons`) renders every size from one
    vector master; replaced the old Arial "F" on the stale `#0F0F17`
  - iOS: opaque full-bleed apple-touch icons at 180/167/152/120, declared
    through Next's metadata API, plus `apple-mobile-web-app-title`
  - Android: maskable variants at a wider inset so the mark survives a circle
    crop; favicons at 16/32 and an SVG master
  - manifest and `themeColor` moved to `#08080C`; stale `favicon.ico` removed
  - `sw.js` CACHE_VERSION -> v3, since it pre-caches manifest.json and an
    installed PWA would otherwise keep the old icon
  - Verified: tags present in the served HTML, every file returns 200, and all
    PNGs are 3-channel with no alpha (iOS composites alpha onto black)

### Session 10 — 2026-09-18
- [x] Replaced the logo with the supplied FitForge artwork
  - Traced it off a thresholded raster rather than by eye: scanlines gave the
    vertices, and every stroke measured ~19.5 units in a 620x500 box
  - `src/lib/logo.ts` holds the geometry — the mark as centrelines plus a
    stroke width, the lettering as one vectorised path
  - `src/components/Logo.tsx`: `LogoMark`, `LogoTile` (mark on the signature
    gradient, squircle radius in proportion to its size) and `LogoLockup`
  - Auth screen now shows the full lockup; the header and the loading splash
    show the tile, replacing the old lime "F"
  - `scripts/generate-icons.mjs` renders every icon from the same module, so
    the icons and the in-app logo cannot drift. Icons crop into the box corner
    and let the arm bleed off the edge; the line weight goes to 28 (44/56 for
    the favicons) so the mark survives at 40px and below
  - `sw.js` CACHE_VERSION -> v4
  - Verified: trace overlaid on the reference matches; icons checked at
    180/120/76/60/40px and under a circle crop; `npm run build` and `tsc`
    clean, lint unchanged (same 9 pre-existing errors)
- [x] Moved the logo into the header
  - The 36px tile read as an abstract badge: at that size the icon crop leaves
    only the box corner, with the arm bleeding off the edge
  - Header now shows the full lockup at 110px in the accent colour and drops
    the Inter "FitForge" beside it — the lettering sets at a 34px cap height
    there, so the logo carries the name. Menu button top-aligned
  - Loading splash shows the same lockup at 150px
  - The tile moved to the drawer's install card, where showing the real
    home-screen icon is the point
  - Verified: `text-accent` resolves through to the SVG's currentColor
    (rgb(220,246,79)); build and tsc clean, lint unchanged
- [x] Put the lettering into the app icons
  - The first icon set carried the mark alone, on the assumption the lettering
    could not hold up small. Measured: at a 60pt tile the "FORGE" caps land
    near 12.7pt, and iOS renders from the 180px asset — it reads fine
  - Everything above favicon size is now the full lockup; mark weight raised
    to 26 so the outline does not look thin beside the lettering
  - Favicons (16/32) keep the mark-only crop — they are drawn at their stated
    size, where the lettering is only texture
  - Maskable variants take a 19% margin rather than a separate framing
  - `LogoTile` now reproduces the icon exactly, so the drawer's install card
    shows the real thing; bumped to 40px there
  - Verified at 180/120/192/32/16px and under a circle crop; build and tsc
    clean, lint unchanged
- [x] Fixed the service worker serving stale icons
  - `CACHE_VERSION` was left at v4 across two icon redraws. Icons go through
    stale-while-revalidate against `STATIC_CACHE`, which is named from that
    key, so an installed PWA kept serving the old mark-only icon even though
    the artwork on disk was correct
  - Split into `SHELL_VERSION` (manual) and `ICONS_VERSION` (a sha256 digest of
    public/icons, stamped in by `npm run icons`), so the key cannot go stale
  - Verified: digest stable across re-runs, changes when any icon byte changes,
    and restores when the icons are regenerated
  - iOS caches home screen icons by URL, outside the service worker — that
    still needs a delete and re-add
- [x] Versioned the icon URLs
  - Fixing our own service worker was not enough: iOS keys home screen icons
    by URL and will not re-fetch one it already holds, and Safari and any CDN
    do the same
  - Icon URLs now end in `?v=<digest>`, in the `<link>` tags via the generated
    `src/lib/icon-version.ts` and in `manifest.json`, both written by
    `npm run icons`
  - Verified on a production build: `/icons/apple-touch-icon-180.png?v=…`
    returns 200 and the served bytes carry the lettering; manifest srcs match
  - Confirmed every icon on disk (120 through 512) contains the lettering, so
    the artwork was never the problem — only its delivery
  - Open question for the user: which commit Vercel has actually deployed.
    The Vercel API 403s on this scope, so it cannot be checked from here
