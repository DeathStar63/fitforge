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
