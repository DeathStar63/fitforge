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

## Future
- [ ] Native iOS wrapper (Capacitor) for automatic Apple Health sync
- [ ] Workout history calendar view
- [ ] Rest timer between sets
