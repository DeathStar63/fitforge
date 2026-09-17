# FitForge - Implementation Plan

## Phase 1: Foundation [COMPLETE]
- [x] Create project documentation (CLAUDE.md, plans.md, tracker.md, decisions.md)
- [x] Scaffold Next.js 16 project with TypeScript + Tailwind CSS 4
- [x] Configure PWA (manifest.json, service worker, SVG icons)
- [x] Set up Supabase client + localStorage storage layer
- [x] Build design system (dark theme, lime green accents, globals.css)
- [x] Build app shell with bottom navigation + Framer Motion

## Phase 2: Training Tab [COMPLETE]
- [x] Create workout data model (exercises, sets, reps, weights per day)
- [x] Build workout day selector (auto-detect day of week + manual pills)
- [x] Build exercise cards with expand/collapse
- [x] Add checkboxes for exercise completion per set
- [x] Add rep/weight input fields per set
- [x] Implement Double Progression tracking logic
- [x] Show progressive overload indicators (last session comparison + weight increase prompts)
- [x] Persist workout logs to localStorage
- [x] Flexible day selection — pick any workout on any day (not locked to day of week)
- [x] Personal best display above "Last Session" in each exercise card
- [x] Exercise swaps (hip thrusts for calves, updated curl/raise/tricep variations)

## Phase 3: Nutrition Tab [COMPLETE]
- [x] Build daily nutrition dashboard (calories, protein, carbs, fats)
- [x] Build conversational food input (text field → Gemini API parses macros)
- [x] Build camera plate scanning (Gemini Vision API)
- [x] Display meal history for the day with delete
- [x] Store nutrition logs in localStorage

## Phase 4: Stats Tab [COMPLETE]
- [x] Volume trends with time range selector (1W/1M/3M/All)
- [x] Weekly overview cards (workouts, sets, volume)
- [x] Weekly sets progress per exercise with category breakdown (Legs/Push/Pull)
- [x] Per-exercise detail: sets completed vs target, best weight, progress bars
- [x] Horizontal bar chart for individual category drill-down
- [x] Apple Health activity section (steps, active calories, exercise minutes, resting HR)
- [x] Manual activity logging with daily progress tracking

## Phase 5: Polish [COMPLETE]
- [x] Add Framer Motion animations (page transitions, card animations, progress bar, nav indicator)
- [x] Optimize for mobile (touch targets, safe areas, no scroll bars, number inputs)
- [x] Add offline support via service worker
- [x] Add proper PNG icons for PWA homescreen
- [x] Add ExerciseDB API GIFs for exercise demonstrations
- [x] Add progress charts (weight over time with Recharts)
- [x] Sync localStorage to Supabase for cloud persistence

## Phase 6: Personalisation [COMPLETE]
- [x] User-owned weekly plan — assign any workout (or rest) to any day
- [x] Routine builder — create, rename, re-emoji and delete your own workouts
- [x] Per-exercise set and rep-range overrides inside a routine, plus reordering
- [x] Exercise library expanded to 108 exercises across legs/push/pull/core/cardio,
      each tagged with primary and secondary muscles and equipment
- [x] Searchable exercise picker with group, equipment and muscle filters
- [x] Interactive front/back muscle map — green (worked) / amber (ready) /
      red (needs work), tap to select, today's workout outlined
- [x] "What to hit next" suggestions from days-since-trained + weekly set volume
- [x] Per-exercise custom GIF URLs, with a muscle-map fallback when an
      animation is missing or fails to load
- [x] Plan syncs to Supabase alongside logs, stats and InBody reports

## Phase 7: Muscle Map Refinement [COMPLETE]
- [x] Strict per-view rendering — a view draws only the muscles visible from it,
      while a selection spans both, with a count badge per side
- [x] Selected muscles grouped by front/back in the detail panel
- [x] Name callouts beside the figure, with leader lines, for each selection
- [x] Muscle groups 17 -> 21: adductors, neck, serratus, tibialis
- [x] Exercise library 108 -> 131, topping up rear delts, side delts,
      forearms and calves, plus a dedicated Neck group in the picker
- [x] Fixed hit targets: an over-wide stroke let the delts swallow neighbouring
      muscles; every region in both views is now click-verified

## Phase 8: Start a Workout From the Body Map [COMPLETE]
- [x] Select muscles -> "Start workout" builds a session targeting them
- [x] Proposed exercises are tweakable before starting, with every other
      movement for those muscles one tap away
- [x] Starting jumps to the training screen with the session open and loggable
- [x] Fixed: workout logs were keyed by date alone, so a second session on the
      same day destroyed the first

## Phase 9: UX Pass [COMPLETE]
- [x] Side drawer: account, plan, sync status and manual sync, companion app
      links, install guidance
- [x] Bottom nav cut from six items to four real destinations, with bigger
      touch targets and readable labels
- [x] Floating install prompt removed — it covered content on every screen
- [x] Rest timer between sets, wall-clock accurate, adjustable, remembered
- [x] Sticky "Start workout" bar on the body map, so a selection made at the
      top of a long screen stays actionable
- [x] Tab switches start at the top of the new screen
- [x] Deleted UserAvatar and InstallPrompt, both absorbed by the drawer

## Phase 10: Premium Visual Pass [COMPLETE]
- [x] Design system in globals.css: deepened tokens, surface/glass/gradient
      utilities, ambient background wash
- [x] Body map redrawn with per-state gradients and a bloom on trained muscles
- [x] Floating frosted bottom nav with a gradient active pill
- [x] Every primary button on one gradient treatment with a matching glow
- [x] Inputs read as wells rather than raised chips
- [x] Charts moved off the leftover white-theme colours
- [x] Frosted side drawer

## Future
- [ ] Native iOS wrapper (Capacitor) for automatic Apple Health sync
- [ ] Workout history calendar view
- [ ] Rest timer between sets
