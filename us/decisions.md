# US ♥ — Decisions

## Separate project, not a feature of another app
This started as a route inside FitForge, but it's a fundamentally different
thing with a different audience and tone. It now lives as its own self-contained
project (`us/`) with its own `package.json`, config, theme, and docs — sharing
no code with neighbouring apps. It can be lifted into its own repo or deployed
independently (Vercel Root Directory = `us`).

## Data-driven content (`story.ts`)
All copy, photos, and interactions live in a single `SCENES[]` array so the
emotional content can be edited without reading component code. This keeps the
"make it yours" step to one file.

## No backend / local-only answers
Her typed answers persist in `localStorage` under the `us-story-answer-` prefix
and are read back on the finale. Rationale: zero setup, instant deploy, fully
private, no accounts. Trade-off: answers live only on the device she uses, so
they aren't sent to you automatically. A future option is emailing/exporting
them (noted in plans.md).

## Light theme, scoped to this app
Warm cream + dusty-pink + earthy text, chosen for a soft, personal, "she loves
pink" feel — intentionally minimal and not flashy. Defined in this project's
own `globals.css` and component classes; nothing global is shared.

## Fonts: Inter + Fraunces
Inter for readable body text; Fraunces (serif) for headings to give an intimate,
hand-written-letter warmth. Loaded via `next/font` (self-hosted at build time).

## Graceful photo placeholders
`PhotoFrame` renders a styled empty frame when an image path contains
"placeholder" or fails to load, so the layout always looks intentional before
real photos are dropped in. Lets the experience be built and previewed first.

## Subtle motion
Framer Motion drives paragraph fade-ins, scene transitions, and a restrained
floating-hearts effect (a handful, slow, low opacity). Kept gentle on purpose —
the brief was "subtle, not too extra."

## Interaction gating
Scenes with a `choice` or `input` gate the Continue button until she engages;
`continue`/`reveal` do not. Keeps the pacing intentional without feeling forced.
