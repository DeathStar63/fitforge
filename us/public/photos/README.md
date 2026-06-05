# Photos for US ♥

Drop your photos in **this folder** (`/public/photos/`), then point each scene
at them in `src/lib/story.ts`.

The placeholder scenes currently look for:

- `/photos/placeholder-1.jpg`  → the "Pune, in the beginning" memory
- `/photos/placeholder-2.jpg`  → the "honest about me" scene
- `/photos/placeholder-3.jpg`  → the "something that's just yours" scene

You can either:

1. **Name your photos to match** (e.g. save a real photo as
   `public/photos/placeholder-1.jpg`), or
2. **Rename freely** (e.g. `public/photos/pune.jpg`) and update the matching
   `image: "/photos/pune.jpg"` line in `src/lib/story.ts`.

Until a real photo exists, the scene shows a soft pink photo frame instead, so
the layout always looks finished.
