# Fitness PWA - FitForge

## Overview
A Progressive Web App for personal fitness transformation tracking. Built for a 25-year-old, 82kg male running a 6-day high-volume Legs/Push/Pull split with 90-min weightlifting + 30-min LISS cardio.

## Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini API (free tier via AI Studio)
- **Exercise GIFs:** ExerciseDB API
- **PWA:** next-pwa with manifest.json + service worker

## Design Language
Premium dark. Tokens and utilities live in `src/app/globals.css`; components
should use those rather than one-off colours.
- Base: `#07070D` with an ambient radial wash (violet / pink / cyan) on `body::before`
- Surfaces: `.surface` (raised, top-lit hairline), `.surface-sunken` (wells,
  inputs), `.glass` (frosted chrome — nav, drawer)
- Signature gradient: violet -> indigo -> blue (`--grad-primary`), used by
  `.btn-primary`, `.grad-primary`, `.text-gradient`, `.ring-gradient`
- Semantic gradients: `--grad-success`, `--grad-warn`, `--grad-danger`, `--grad-flame`
- Muscle map states: worked `#34D399`->`#047857`, ready `#FBBF24`->`#B45309`,
  needs work `#F43F5E`->`#9F1239`, each as an SVG gradient with a bloom on
  trained and selected muscles
- Text: `#F5F5F8` primary, `#9B9BB0` muted, `#61617C` subtle
- Font: Inter. Headings `tracking-[-0.02em]`
- Radius: 24px hero cards, 16px cards, 12px controls
- Bottom nav: floating frosted pill, gradient behind the active tab

## Workout Split (default — fully customisable)
The schedule below is the default plan. It lives in `src/lib/plan.ts` and users
can reassign any workout to any day, build their own routines, and pick
exercises from the library in `src/lib/exerciseLibrary.ts` (131 exercises).
- **Mon & Thu:** Legs & Core (9 exercises)
- **Tue & Fri:** Push - Chest, Shoulders, Triceps (9 exercises)
- **Wed & Sat:** Pull - Back, Biceps, Rear Delts (9 exercises)
- **Sunday:** Rest day
- 3 sets per exercise, Double Progression Method (8-12 reps)

## Key Features
1. **Training Tab:** Workout dashboard with exercise GIFs, checkboxes, rep/weight logging, progressive overload tracking
2. **Nutrition Tab:** Gemini AI conversational food logging + plate photo scanning, daily macro tracking
3. **Body Tab:** Interactive front/back muscle map over 21 muscle groups,
   coloured by recovery state. Each view shows only the muscles visible from
   it, while a selection spans both. Tap a muscle for a name callout and the
   exercises that train it, plus suggestions for what to train next.
   "Start workout" builds a session from the selected muscles and opens it on
   the Training tab
4. **Stats Tab:** BMI/body stats input, transformation progress, Gemini AI analysis
5. **Plan Editor:** Reachable from the Training tab header or the side drawer —
   assign workouts to days, build routines, set per-exercise sets/reps, attach
   custom exercise GIFs
6. **Side Drawer:** Menu button in the header — account, plan, sync status and
   manual sync, InBody/HealthifyMe links, install guidance
7. **Rest Timer:** Starts automatically when a set is completed; adjustable and
   remembered between sessions

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=
```

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Project Documentation
- `plans.md` — Implementation plan and roadmap
- `tracker.md` — Progress tracker
- `decisions.md` — Architecture and design decisions
