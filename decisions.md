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

## ADR-019: Navigation — Four Tabs and a Drawer
**Decision:** The bottom bar carries the four destinations inside the app (Training, Body, Progress, Stats). Everything that is not a destination — account, the plan editor, sync, the InBody and HealthifyMe links, install instructions — moved into a right-hand drawer behind a menu button in the header.
**Why:** the bar had six items, two of which navigated *out* of the app entirely. Six targets across a phone width forced 10px labels and cramped touch targets, and mixing "go to this screen" with "leave for another app" in one row made neither obvious. The drawer also gives the plan editor a second, discoverable entry point; it was previously reachable only from a button on the Training header.
**Also folded in:** `UserAvatar`'s dropdown became the drawer's account section, and the floating `InstallPrompt` became a row in the drawer. Both files are deleted.

## ADR-020: The Install Prompt Stops Covering Content
**Decision:** Install guidance lives in the drawer instead of a `fixed bottom-20` card.
**Why:** it sat on top of whatever screen you were on for three days at a time, obscuring exercise cards and the body map. Install is a one-off action a user takes when they decide to, not something worth permanently occluding the app for.

## ADR-021: Rest Timer Driven by a Run Key
**Decision:** `RestTimer` takes a `runKey` counter that the training screen increments whenever a set goes from incomplete to complete. A change to that number restarts the countdown.
**Why this shape:** the caller does not have to know whether a rest is already running, and the timer owns all its own state. The transition is detected in the event handlers against a ref mirror of the log rather than by watching state in an effect — `ExerciseCard` is memoised, so a handler whose identity changed on every logged set would re-render every card in the workout.
**Implementation notes:** it counts against a wall-clock end time rather than accumulating interval ticks, so backgrounding the tab does not leave it behind; the duration is remembered in localStorage and adjustable by 15s; the restart is done with the "adjust state when a prop changes" pattern rather than an effect, which would render the previous remaining time for a frame before correcting it.

## ADR-022: A Design System, Not Scattered Gradients
**Decision:** Visual language lives in `globals.css` as tokens plus five utilities — `.surface`, `.surface-sunken`, `.glass`, `.btn-primary`/`.grad-primary`, `.ring-gradient` — and components use those instead of one-off colour classes.
**Why:** the ask was "make it look premium, use gradients". Sprinkling gradients per component produces an app where every screen is slightly differently premium. Because the Tailwind v4 `@theme` block already generated every `bg-bg-card` / `text-text-muted` / `border-border` utility from tokens, deepening the palette in one place lifted every screen at once, and the utilities then handled the surfaces that needed real treatment.
**The palette:** near-black base (`#07070D`), layered translucent surfaces, one signature gradient (violet → indigo → blue) for anything primary, and semantic gradients for the states the body map reports.
**The detail that does the work:** `.surface` draws a hairline of light along the top edge of each card. That single 1px gradient is most of the difference between "dark theme" and something that looks lit — a flat dark rectangle reads as absence of colour, a top-lit one reads as a physical panel.
**Ambient wash:** `body::before` lays three wide radial gradients over the base so the near-black never reads as flat grey. It is `position: fixed` and `pointer-events: none`, sitting under content that is already positioned.

## ADR-023: Body Map Gradients
**Decision:** Each muscle state is an SVG `linearGradient` rather than a flat fill, and muscles in the `worked` state (plus anything selected) get a Gaussian bloom.
**Why:** flat fills made neighbouring muscles in the same state merge into a single blob — the whole upper back read as one green shape. A vertical gradient gives every shape its own highlight and shadow, so the separator strokes have something to separate.
**Tuning note:** the first attempt used pale top stops (`#FDA4AF`, `#6EE7B7`) which read as pastel rather than premium against black. Deep bottom stops with saturated tops (`#F43F5E` → `#9F1239`) hold up far better on a near-black background.
**Restraint:** the bloom is applied only to trained and selected muscles. Glowing all 21 at once is noise, not emphasis.

## ADR-024: Charts Were Still Light-Themed
**Decision:** Recharts grids, axes and tooltips moved to the dark palette.
**Why:** they carried `#FFFFFF` tooltip backgrounds, `#E5E7EB` grid lines and `#1A1A2E` label text — left over from the white theme described in ADR-004 and never updated when the app went dark. A white tooltip card on a near-black chart is the most obvious possible seam.

## ADR-025: Brand Mark and App Icon
**Decision:** The logo is the supplied FitForge artwork — an isometric open box with the "FIT FORGE" lettering set into its right-hand face — rebuilt as vectors in `src/lib/logo.ts`. `src/components/Logo.tsx` renders it in the app and `scripts/generate-icons.mjs` (`npm run icons`) renders every icon size from the same module, so the two can never drift.

**Traced, not eyeballed.** The artwork was measured off a thresholded raster: scanlines gave the edge positions, and every stroke came back ~19.5 units wide in a 620x500 box. Three earlier logos were designed from scratch and all three were rejected; the conversation only converged once there was a reference to reproduce.

**Centrelines plus a stroke width, not filled outlines.** The original line is ~19.5/620 of the mark's width, which is under a pixel at a 60px launcher icon. Storing the mark as a path plus a `stroke` argument lets the icons carry a heavier line (28) than the display lockup without maintaining a second drawing.

**The lettering is a separate traced path.** It is geometric and only ever appears above ~120px wide, so a potrace-style vectorisation is faithful and needs no font dependency. It ships only in `LogoLockup`, which the auth screen uses; chrome uses the mark alone.

**Icons crop into the mark.** The mark is 620x500 — wide and short — so scaling the whole thing into a square tile leaves it small and stranded. The icons instead frame the box corner and let the long arm bleed off the right edge, which reads as a mark rather than a shrunken lockup and still resolves at 40px.

**Lime field rather than the inverse:** a near-black icon disappears against a dark wallpaper, and the brief was that it be visible on the home screen. It also matches the in-app logo tile, so the two read as the same brand.
**iOS specifics:** the apple-touch icons are flattened to fully opaque, because iOS ignores alpha and composites transparency onto black. They are full-bleed, because iOS applies its own squircle mask. `appleWebApp.title` supplies `apple-mobile-web-app-title`, the caption under the icon; without it iOS falls back to the page title.
**Maskable variants** use a pulled-back framing (`ICON_MASKABLE_VIEWBOX`) rather than a scaled-down copy, so the whole box sits inside the central safe circle that Android may crop to.
**Cache:** `sw.js` pre-caches `manifest.json`, so `CACHE_VERSION` has to move whenever the icons do. Bumped to v4 — otherwise an already-installed PWA keeps serving the old manifest and the old icon.
**Node version:** the icon script imports `src/lib/logo.ts` directly and leans on Node's type stripping, so `npm run icons` needs Node >= 22.18. It is a dev-only script; the app build is unaffected.

## ADR-026: The Logo Goes In The Header, Not A Badge
**Decision:** The app header shows the full lockup — mark plus "FIT FORGE" lettering — at 110px wide in the accent colour, and the wordmark set in Inter beside it is gone. The loading splash shows the same lockup at 150px.
**Why:** the header first carried the mark alone on a 36px gradient tile, with "FitForge" in Inter next to it. At that size the crop that makes the icon work against it — the arm bleeds off the tile, so only the box corner is left — and it reads as an abstract badge rather than as the logo. The lettering is 156 of the mark's 500 units tall, so at 110px wide it sets at a 34px cap height and is perfectly legible; the logo can simply carry the name itself.
**Cost:** roughly 40px of header height. Worth it — this is the one place the brand appears on every screen.
**The menu button is top-aligned**, not centred, so it reads as chrome beside the logo instead of floating at its mid-height.
**The tile survives** in the drawer's install card, at 26px next to "Install FitForge", where showing the actual home-screen icon is the point.

## ADR-027: The Lettering Belongs In The Icon Too
**Decision:** Every icon above favicon size carries the full lockup, lettering included. Only the 16 and 32px favicons fall back to the mark-only crop.
**Why the first version left it out, and why that was wrong:** the mark-only crop was chosen on the assumption that the lettering could not survive a launcher icon. Measured rather than assumed, it can: the lettering is 156 of the mark's 500 units tall, so in a 60pt tile at a 6% margin the "FORGE" caps land near 12.7pt — ordinary text size, and iOS renders it from the 180px asset. Favicons are the real limit, because they are drawn at their stated 16 or 32 pixels rather than scaled from a larger asset.
**Mark weight goes to 26** in the icons. At the artwork's own 19.5 the outline looks thin beside the heavy lettering once both are small.
**`LogoTile` reproduces the icon exactly**, lockup and all, so the drawer's install card shows what will actually land on the home screen.

**This decision was recorded before it was implemented, and then was not implemented for four commits.** See ADR-030.

## ADR-030: Two Ways I Shipped Nothing And Believed Otherwise
**What happened:** ADR-027 was written, the code was edited, the icons were regenerated — and the commit that claims to carry all of it, `0d74718`, contains two documentation files and no code. The lettering did not reach the repository until four commits later. Three rounds of cache fixes were then built on top, each one correctly delivering an icon that had never had text in it.

**Cause one — `git reset --hard` in a commit step.** The commit command began with `git reset -q --hard HEAD~0`. `HEAD~0` is `HEAD`, so that is `reset --hard HEAD`: it discards every uncommitted change in the working tree. It ran before `git add -A`, so it threw away the source edits and the regenerated icons, and then committed only the documentation written after it. **Never put `reset --hard` in a commit path.** There is no version of "clean up before committing" that is worth a silent discard of the work being committed.

**Cause two — a verification that could not fail.** The check for "does this icon have lettering?" counted dark pixels in the right-hand 45% of the image. The mark's long arm crosses that exact region, so a mark-only icon scores just as high as a lettered one. It reported a pass four times on artwork that had no lettering at all. **A metric that cannot distinguish the two states it is asked to distinguish is worse than no check**, because it converts an open question into false confidence. The icon was only ever settled by rendering it and looking at it.

**Both failures share a shape:** the artifact was never inspected. `git show --stat` on the commit, or one look at the PNG, would have caught either in seconds. Confirm the thing itself, not a proxy for it.

## ADR-028: The Service Worker Cache Key Is Generated, Not Hand-Bumped
**Decision:** `public/sw.js` splits its cache key into `SHELL_VERSION`, bumped by hand, and `ICONS_VERSION`, a sha256 digest of `public/icons` that `npm run icons` stamps in automatically.
**Why:** the icons are served from `STATIC_CACHE` under a stale-while-revalidate rule, and that cache is named from the key — so an unchanged key means an installed PWA keeps handing out the icons it already has. ADR-025 established "bump `CACHE_VERSION` whenever the icons change" as a rule written at the top of the file, and it was then missed on two consecutive icon changes. The artwork shipped correct and the phone kept showing the old one.
**Why automation rather than more discipline:** nothing fails when you forget. The build is green, the tests pass, the repo looks right, and the only symptom is on someone's home screen. A rule with no failure mode attached is not a rule.
**Residual:** changing `src/lib/logo.ts` without re-running `npm run icons` still drifts the in-app logo from the icons. The script is the single point that keeps them together, so it has to run whenever the geometry moves.
**Not in scope:** iOS caches home screen icons by URL, outside the service worker entirely. Nothing in the app can invalidate that — the icon has to be removed and re-added, or the icon URLs themselves have to change.

## ADR-029: Icon Filenames Carry The Artwork's Digest
**Decision:** Every icon is written as `<stem>.<digest of the artwork>.<ext>`, and `public/icons` is emptied on each run so no unversioned file survives. `npm run icons` writes the files, the digest into `src/lib/icon-version.ts` and `public/sw.js`, and the stamped URLs into `manifest.json`; `layout.tsx` builds the same names from `ICON_VERSION`.
**Why, in the order we learned it:** ADR-025 assumed a hand-bumped `CACHE_VERSION` was enough, and it was missed twice. ADR-028 automated that bump, and the icon on the phone still did not change, because our service worker was only one of three caches. The first attempt at this ADR added `?v=<digest>` to the URLs — better, but a query string is not part of a resource's identity everywhere it is handled, and iOS's home screen icon store is one of the places it is not. A distinct path is unambiguous: nothing can collapse `apple-touch-icon-180.<digest>.png` back onto the file it replaced.
**Emptying the directory matters as much as the naming.** A stale unversioned file left behind is a URL some cache still has a reference to, and it would keep serving the old artwork forever. After a run, the old paths 404.
**Why a digest and not a timestamp or a counter:** it changes exactly when the artwork changes. A build timestamp would re-download every icon on every deploy; a counter is the hand-bumped constant that already failed twice.
**Verified** on a clean production build: the link tags carry the digest filenames, those URLs return the bytes with the lettering, and the old unversioned paths return 404.
**Still outside the repo's reach:** whether the deploy runs at all. If Vercel's production branch is not `main`, none of this reaches the phone, and nothing here can tell us.
