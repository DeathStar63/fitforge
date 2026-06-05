# Photos for the "/us" experience

Drop your photos in **this folder** (`/public/us/`), then point each scene at
them in `src/lib/story.ts`.

The placeholder scenes currently look for:

- `/us/placeholder-1.jpg`  → the "Pune, in the beginning" memory
- `/us/placeholder-2.jpg`  → the "honest about me" scene
- `/us/placeholder-3.jpg`  → the "something that's just yours" scene

You can either:

1. **Name your photos to match** (e.g. save a real photo as
   `public/us/placeholder-1.jpg`), or
2. **Rename freely** (e.g. `public/us/pune.jpg`) and update the matching
   `image: "/us/pune.jpg"` line in `src/lib/story.ts`.

Until a real photo exists, the scene shows a soft pink photo frame instead, so
the layout always looks finished.

## Optional background music

Drop an `.mp3` here (e.g. `public/us/song.mp3`) and set
`musicSrc: "/us/song.mp3"` in `STORY_CONFIG` at the top of
`src/lib/story.ts`. A small music toggle then appears in the top bar.

## Where she opens it

The experience lives at the URL **`/us`** (e.g. `https://your-app.vercel.app/us`).
It's intentionally unlinked from the fitness app — a private surprise.
