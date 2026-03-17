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
- Clean, minimal white theme inspired by fitness app UI reference
- Background: `#FFFFFF` (pure white), Cards: `#FFFFFF`, Surface: `#F5F6FA`
- Primary accent: `#1A1A2E` (dark navy — buttons, active nav, CTAs)
- Category colors: Orange `#F97316` (calories), Blue `#3B82F6` (protein), Green `#22C55E` (carbs/success), Pink `#F472B6` (fats)
- Text: `#1A1A2E` (primary), `#6B7280` (muted), `#B0B5C0` (subtle)
- White cards with subtle box shadows, minimal borders
- Pastel icon backgrounds (orange/8, blue/8, etc.) for stat/macro icons
- Font: Inter (sans-serif)
- Border radius: 16px cards, 12px buttons/inputs
- Bottom nav: dark rounded square behind active icon (white icon inside)
- Tab selectors: underline style

## Workout Split (Legs/Push/Pull x2)
- **Mon & Thu:** Legs & Core (9 exercises)
- **Tue & Fri:** Push - Chest, Shoulders, Triceps (9 exercises)
- **Wed & Sat:** Pull - Back, Biceps, Rear Delts (9 exercises)
- **Sunday:** Rest day
- 3 sets per exercise, Double Progression Method (8-12 reps)

## Key Features
1. **Training Tab:** Workout dashboard with exercise GIFs, checkboxes, rep/weight logging, progressive overload tracking
2. **Nutrition Tab:** Gemini AI conversational food logging + plate photo scanning, daily macro tracking
3. **Stats Tab:** BMI/body stats input, transformation progress, Gemini AI analysis

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
