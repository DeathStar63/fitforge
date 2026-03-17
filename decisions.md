# FitForge - Architecture & Design Decisions

## ADR-001: PWA over Native App
**Decision:** Build as a Progressive Web App using Next.js
**Why:** Bypasses app store, installs to homescreen, works cross-platform, faster to develop
**Trade-off:** Slightly less native feel, but Framer Motion compensates with smooth animations

## ADR-002: Next.js 14 App Router
**Decision:** Use Next.js 14 with App Router (not Pages Router)
**Why:** Modern React patterns, server components, better routing, built-in API routes for Gemini proxy

## ADR-003: Supabase for Backend
**Decision:** Use Supabase over Firebase
**Why:** User preference. PostgreSQL gives us relational data (exercises → sets → reps), generous free tier, built-in auth if needed later

## ADR-004: Dark Theme with Lime Green Accents
**Decision:** Dark UI (#0F0F1A background) with #BAFF39 lime green primary accent
**Why:** Based on Figma "Fitness Tracking Mobile App Template". Dark theme is better for gym use (less eye strain), lime green provides high contrast for actionable elements

## ADR-005: Legs/Push/Pull Day Order
**Decision:** Mon/Thu=Legs, Tue/Fri=Push, Wed/Sat=Pull
**Why:** Avoids "International Chest Day" Monday gym crowds. Legs on Monday when energy is highest from Sunday rest

## ADR-006: Double Progression Method
**Decision:** Track reps within 8-12 range, increase weight when 3x12 is hit
**Why:** Simple, proven progressive overload system. The app will automatically detect when user hits 12/12/12 and suggest a weight increase

## ADR-007: Gemini API for AI Features
**Decision:** Use Google Gemini API (free tier) for nutrition parsing and body analysis
**Why:** Free tier sufficient for personal use. Handles both text (food logging) and vision (plate scanning, BMI analysis)

## ADR-008: ExerciseDB API for Exercise GIFs
**Decision:** Use ExerciseDB API for exercise demonstration GIFs
**Why:** Free, comprehensive database of exercise animations. No need to host our own media files

## ADR-009: Local Storage + Supabase Hybrid
**Decision:** Use localStorage for immediate state, sync to Supabase for persistence
**Why:** Ensures app works offline in gym (poor WiFi), syncs when connection available
