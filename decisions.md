# FitForge - Architecture & Design Decisions

## ADR-001: PWA over Native App
**Decision:** Build as a Progressive Web App using Next.js
**Why:** Bypasses app store, installs to homescreen, works cross-platform, faster to develop
**Trade-off:** Slightly less native feel, but Framer Motion compensates with smooth animations

## ADR-002: Next.js 14 App Router
**Decision:** Use Next.js 14 with App Router (not Pages Router)
**Why:** Modern React patterns, server components, better routing, built-in API routes for Gemini proxy

## ADR-003: Supabase for Backend
**Decision:** Use Supabase over Firebase
**Why:** User preference. PostgreSQL gives us relational data (exercises → sets → reps), generous free tier, built-in auth if needed later

## ADR-004: Clean White Theme with Dark Navy Accents
**Decision:** White UI (#FFFFFF background, #F5F6FA surface) with #1A1A2E dark navy primary accent. Category colors: orange (calories), blue (protein), green (carbs/success), pink (fats). Inter font, 16px card radius.
**Why:** Redesigned in Session 3 (2026-03-23) away from the original dark/lime-green direction toward a cleaner, modern fitness-app aesthetic. The white theme reads better in daylight (most workout logging happens at the gym during the day), pastel category colors provide clearer at-a-glance differentiation between macro types, and the dark-navy CTA stands out without the high-contrast harshness of neon accents.
**Superseded:** Original dark theme (#0F0F1A bg, #BAFF39 lime accent) used in Sessions 1-2.

## ADR-005: Legs/Push/Pull Day Order
**Decision:** Mon/Thu=Legs, Tue/Fri=Push, Wed/Sat=Pull
**Why:** Avoids "International Chest Day" Monday gym crowds. Legs on Monday when energy is highest from Sunday rest

## ADR-006: Double Progression Method
**Decision:** Track reps within 8-12 range, increase weight when 3x12 is hit
**Why:** Simple, proven progressive overload system. The app will automatically detect when user hits 12/12/12 and suggest a weight increase

## ADR-007: Gemini API for AI Features
**Decision:** Use Google Gemini API (free tier) for nutrition parsing and body analysis
**Why:** Free tier sufficient for personal use. Handles both text (food logging) and vision (plate scanning, BMI analysis)

## ADR-008: ExerciseDB API for Exercise GIFs
**Decision:** Use ExerciseDB API for exercise demonstration GIFs
**Why:** Free, comprehensive database of exercise animations. No need to host our own media files

## ADR-009: Local Storage + Supabase Hybrid
**Decision:** Use localStorage for immediate state, sync to Supabase for persistence
**Why:** Ensures app works offline in gym (poor WiFi), syncs when connection available

## ADR-010: User-Owned Weekly Plan
**Decision:** The Legs/Push/Pull schedule moved out of `lib/workouts.ts` and into a `WeekPlan` document the user edits (`lib/plan.ts`), surfaced through `PlanContext`. `lib/workouts.ts` now only holds types and the helpers that turn a plan into a workout day.
**Why:** The split was hardcoded for one person. Anyone else wants their own days and their own exercises.
**Trade-off:** Anything that previously read the constant `workoutDays` (Progress, Stats/VolumeChart) had to become plan-aware, and the volume chart's series are now generated per routine rather than three fixed lines.
**Compatibility:** The three default routines keep the ids `legs`, `push` and `pull`, and the default day assignment reproduces the old schedule exactly, so logs written before this change still resolve. `getPlan()` drops references to exercises that are no longer in the library.
**Supersedes:** ADR-005, which fixed the day order. That order is now just the default.

## ADR-011: Hand-Built SVG Muscle Map
**Decision:** Draw the body as SVG paths in `lib/muscles.ts` — right-half geometry mirrored at render time, muscle shapes clipped to the silhouette — rather than pulling in an anatomy image or a body-map library.
**Why:** It stays a few KB, themes with the rest of the app, scales to any size, and every region is a real DOM node so it can be tapped and animated. Mirroring halves the geometry to maintain and makes symmetry automatic; clipping to the silhouette means a muscle shape can be drawn generously without spilling past the body outline.
**Note:** `<clipPath>` only accepts shape elements, so the region renderer emits bare `<path>` elements with no wrapper `<g>`.

## ADR-012: Weighted Set Counting for Muscle Status
**Decision:** A completed set counts 1.0 toward each of the exercise's primary muscles and 0.5 toward each secondary. Only primary work moves the "last trained" marker.
**Why:** It is the standard direct-vs-indirect volume convention, and it keeps a muscle from looking freshly trained because it assisted on something else. Statuses are: worked (trained within 2 days), ready (3-4 days), needs work (5+ days or never).

## ADR-013: Exercise GIFs Degrade Instead of Breaking
**Decision:** `gifUrl` is optional in the library. When it is missing or the image fails to load, the card renders the body map with that exercise's muscles highlighted, and the user can attach their own GIF URL per exercise from the plan editor.
**Why:** The new library entries have no verified static GIF URLs, and hotlinked GIFs can disappear or block referrers. Showing which muscles the movement trains is a useful answer rather than an empty box, and a user-supplied link is a permanent fix for any individual exercise.

## ADR-014: Muscle Groups Modelled, and Ones Deliberately Merged
**Decision:** 21 selectable groups. Added over the original 17: **adductors** (own machine and its own squat variations), **neck** (serious lifters train it directly), **serratus anterior** (pullovers, protraction work) and **tibialis anterior** (raises, now commonly programmed for knee health).
**Deliberately merged rather than split:**
- *Gastrocnemius and soleus* stay one "calves" group — the distinction lives in the exercise names (seated = soleus, standing = gastroc) where it is actionable, rather than as two tap targets on the same 20-pixel shape.
- *Rhomboids and mid-traps* sit inside "upper back"; nothing in a program targets them separately from rows.
- *Brachialis* sits inside "biceps"; hammer and reverse curls carry the distinction.
- *Glute medius* sits inside "glutes", with hip abduction tagged there.
**Why the line is here:** a group earns its own region when a lifter would program for it directly and could ask "have I trained this recently". Anything finer makes the map harder to tap without telling them anything they would act on.

## ADR-015: Callout Labels over an Adjacent Legend
**Decision:** A selected muscle gets a name in a column to the right of the figure, joined by a thin leader line from a hand-placed anchor point (`LABEL_ANCHORS` in `lib/muscles.ts`). Anchors are on the right-hand half only, so no line crosses the body. The viewBox widens by a fixed gutter to make room; the figure itself is height-constrained so it does not shrink.
**Why hand-placed:** path centroids land in the wrong place for curved shapes — the centroid of the lat sweep sits off the muscle entirely.
**Why a stacked column:** labels are sorted head-to-toe and pushed apart to a minimum gap, so a dozen selections stay legible instead of piling up on one another.
**Related fix:** the transparent hit targets were widened by a 10-unit stroke, which grows each region by half that in every direction — enough for the side delt to swallow the front delt, and the front delt to swallow both the trap and the pec. Narrowed to 3, and three anchors were moved off ground that a neighbouring delt legitimately covers. Verified by driving a browser and clicking every anchor in both views, asserting the right name came back: 26 of 26.
**Guard:** `npm run check:muscles` (`scripts/check-muscle-map.mjs`) cross-checks the five structures that have to agree — the group list, the two region maps, the anchors and the paint order — plus that every muscle has at least one exercise naming it as primary. A mismatch there fails silently at runtime: a muscle declared visible but missing its path simply never draws. That is how `adductors` and `tibialis` were briefly declared but undrawn while this was being built.

## ADR-016: More Than One Workout Log Per Day
**Decision:** Workout logs are keyed `${date}__${workoutId}` instead of by date alone.
**Why:** `saveWorkoutLog` did `logs[log.date] = log`, so a day held exactly one session. Logging a second workout on the same date silently destroyed the first — already reachable by switching workout tabs and logging a set, and unavoidable once a quick session can run alongside the planned one.
**Compatibility:** entries written under the old scheme keep their bare-date key. Every reader that iterates `Object.values()` is unaffected, because each entry carries its own `date` and `workoutId`. `getWorkoutLog(date, workoutId)` falls back to the legacy key, and `saveWorkoutLog` re-keys an entry the first time it is touched and deletes the old copy, so nothing is counted twice. Verified in a browser: a seeded legacy log reads back, re-keys on save without duplicating, and untouched old entries stay visible to the volume and muscle-status readers.

## ADR-017: A Quick Session Is a Routine, Not a New Concept
**Decision:** Starting a workout from the body map writes an ordinary routine into the plan under the reserved id `quick`, replacing its contents each time.
**Why:** The alternative was a parallel "ad-hoc workout" type with its own storage, its own sync, its own rendering path on the training screen and its own logging identity. Reusing a routine means it already syncs with the plan, already appears as a tab, already logs against a workout id, and can be edited, rescheduled or deleted like anything else.
**Consequence:** the Quick Session shows up in the plan editor and as a category in Progress and Stats. That is the honest result — it is a real workout that was really performed — and it lets someone keep a session they liked by renaming it.
**Note on progressive overload:** `getLastWorkoutLog("quick")` compares against the previous quick session, which may have targeted different muscles. This is harmless because `ExerciseCard` matches previous sets by exercise id, so a movement that was not in the last quick session simply shows no comparison.

## ADR-018: How a Session Is Proposed From Selected Muscles
**Decision:** `buildSessionForMuscles` scores each exercise per target muscle: it must train the target directly, gains for every *other* selected muscle it also covers, and gains for specificity (`2 / primary.length`, so a movement whose only primary mover is the target beats one that splits its effort). The compound bonus applies only when more than one muscle is selected. Selection round-robins over the muscles so each is covered before any gets a second exercise, then sorts compounds first.
**Why the specificity term:** without it, asking for triceps alone returned chest dips and close-grip bench — compounds that happen to involve triceps — because the compound bonus dominated. With it, a lone triceps pick returns pushdowns, overhead extensions and skull crushers, while chest+triceps still leads with presses and dips.
