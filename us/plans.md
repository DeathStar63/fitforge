# US ♥ — Plan

## What this is
A private, interactive photo + story experience to share with a loved one. The
goal is gentle and honest: to talk about needing our own space and rebuilding
individuality, and to suggest setting healthy boundaries — together. Soft and
sincere, never overwhelming.

## Experience design
A single-page, scene-by-scene player she taps through:

1. A warm hello.
2. "Our lives depend a lot on each other — and they shouldn't." We each need
   our own contentment first, then time together means more.
3. The "I don't know who I am without you" line, and how we never set
   boundaries (and crossed the ones we did, out of love).
4. **Pune memory** (photo): the healthy rhythm we once had — meeting once a
   day, then our own separate lives.
5. **Honesty about me**: feeling low and lonely, leaning too much on her,
   no friends here, after-work Gmeets — owning my own dependency too.
6. A tap-to-reveal note.
7. The boundaries proposal — our own lives first, then coming back to each
   other by choice; being able to ask for space without it meaning trouble.
8. Two text prompts she answers in her own words.
9. A soft "can we try this, together?" choice.
10. A finale: an envelope she opens, her answers shown back, floating hearts.

## Interactions
- **Choice buttons** — playful taps with a sweet response.
- **Tap-to-reveal** — a hidden note.
- **Type her thoughts** — saved to `localStorage`, surfaced at the finale.
- **Surprises** — subtle floating hearts; a final envelope.

## Tech approach
- Next.js 16 + TS, Tailwind v4, Framer Motion. No backend.
- Content fully data-driven from `src/lib/story.ts` so words/photos are easy
  to edit without touching components.
- Graceful photo placeholders so it looks finished before real photos exist.

## Possible future touches
- Optional background music (toggle already supported — just add an mp3).
- Per-scene branching choices.
- Emailing/exporting her typed answers instead of local-only storage.
