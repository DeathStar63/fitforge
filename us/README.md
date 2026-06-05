# US ♥

An interactive photo + story experience — a private, gentle, scene-by-scene
letter you can share with someone you love. They tap through it: photos,
heartfelt text, and small interactions (choices, a hidden note to reveal,
boxes where they type their own thoughts) ending in a warm finale.

This is a **standalone project**, completely separate from anything else.

## Tech

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **Framer Motion**
- Warm, minimal **white + dusty-pink, earthy** theme with the *Fraunces* serif
- No backend — answers she types are saved locally on her device and shown
  back on the final screen

## Make it yours

Everything you'd edit lives in **one file: `src/lib/story.ts`**.

1. Set `herName` and `yourName` in `STORY_CONFIG` at the top.
2. Add your photos to `public/photos/` (see `public/photos/README.md`).
3. Edit the scene headings and paragraphs — the text is already written in
   your own words, keep tweaking it freely.
4. Add / remove / reorder scenes. They simply play top to bottom.

There's one line left for you to write yourself — the hidden "note" in the
`reveal-note` scene. It's marked in the file.

## Run it

```bash
npm install
npm run dev      # open http://localhost:3000
npm run build    # production build
npm run lint
```

The whole site **is** the experience — she just opens the link.

## Deploy

Deploy the `us/` folder as its own project (e.g. on Vercel: set the project's
**Root Directory** to `us`). Share the URL privately.

## Docs

- `plans.md` — what this is and the build plan
- `tracker.md` — progress + what's left for you to do
- `decisions.md` — design & architecture decisions
- `CLAUDE.md` — project context/instructions
