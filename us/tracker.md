# US ♥ — Progress Tracker

## ✅ Done
- [x] Standalone Next.js 16 + TS project scaffolded (separate from FitForge)
- [x] Tailwind v4 + Framer Motion set up; warm white/pink/earthy theme
- [x] Inter (body) + Fraunces (serif headings) via `next/font`
- [x] Data-driven scene engine (`src/lib/story.ts` → `SCENES[]`)
- [x] Scene player with progress bar, back button, page transitions
- [x] Interaction types: continue, choice, input (saved), reveal, finale
- [x] Tap-to-reveal hidden note
- [x] Free-text inputs saved to `localStorage`, shown back at the finale
- [x] Floating-hearts surprise + final envelope reveal
- [x] Graceful photo placeholders (`PhotoFrame`)
- [x] Optional music toggle (appears when `musicSrc` is set)
- [x] Real story copy written in the user's own words
- [x] Project docs (README, CLAUDE.md, plans, decisions)

## ✍️ For you to do
- [ ] Set `herName` / `yourName` in `STORY_CONFIG` (`src/lib/story.ts`)
- [ ] Add real photos to `public/photos/` (see that folder's README)
- [ ] Write the hidden note line in the `reveal-note` scene
- [ ] Read through and tweak any wording so it's 100% yours
- [ ] (Optional) Add a song mp3 and set `musicSrc`
- [ ] `npm install` then `npm run dev` to preview
- [ ] Deploy with the project Root Directory set to `us/`, share the link

## 💡 Ideas / backlog
- [ ] Branching choices that change later scenes
- [ ] Email/export her typed answers (currently local-only)
- [ ] A few more memory/photo scenes
