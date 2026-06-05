# US ♥

## Overview
A standalone, interactive photo + story web app — a private, heartfelt letter
shared with a loved one. It is **its own project**, fully separate from any
other app in this folder tree (e.g. FitForge). Do not couple it to, import
from, or share configuration with neighbouring projects.

## Purpose & tone
A gentle, honest journey about giving each other space and rebuilding
individuality — setting healthy boundaries, together. The feeling is soft and
sincere, not a grand or overwhelming gesture. Keep all copy in the user's own
voice.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Fonts:** Inter (body) + Fraunces (serif headings) via `next/font`
- **No backend.** Typed answers persist in `localStorage` and are shown back
  on the finale screen.

## Design Language
- Minimal, warm, light theme: cream background `#FBF5F2`, white cards
- Pink accents: dusty rose `#D98B9B`, soft pink `#E8A0AE`, deep `#C06B7C`
- Earthy text tones: `#5A4A44` (primary), `#6B5852`, muted `#A98F88`
- Rounded corners (16–20px), soft pink-tinted shadows, subtle motion
- Serif for headings (Fraunces), sans for body (Inter)

## Architecture
- `src/lib/story.ts` — the single source of content: `STORY_CONFIG` (names,
  optional music) + a `SCENES[]` array. This is the only file most edits touch.
- `src/components/StoryExperience.tsx` — the scene player / engine: navigation,
  progress bar, music toggle, and all interaction types.
- `src/components/PhotoFrame.tsx` — framed photo with graceful placeholder.
- `src/components/Hearts.tsx` — subtle floating-hearts surprise.
- `src/app/page.tsx` — renders the experience at the site root.

### Scene model
Each scene can mix a photo, heading, body paragraphs, and ONE interaction:
`continue` | `choice` | `input` (typed + saved) | `reveal` (tap-to-reveal) |
`finale` (envelope + saved answers + hearts burst).

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Docs
- `plans.md`, `tracker.md`, `decisions.md`
