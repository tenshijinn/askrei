

# Fix Build & Complete Rei Standalone Platform

## Current State

All frontend code IS populated — `Rei.tsx` (316 lines), `ReiChatbot.tsx` (219 lines), `PostToRei.tsx` (169 lines), all 11 joinrei components, wallet providers, payment components, etc. The task list in your screenshot is outdated from a previous build attempt.

The `/rei` page likely shows nothing because:
1. The build may be failing due to a missing `@types/qrcode` dev dependency (used in `PostToRei.tsx`)
2. Supabase is not connected — no `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` env vars, so the client crashes on load
3. No edge functions or database migrations exist yet (the `supabase/` directory is empty)

## Plan

### Step 1: Fix build errors
- Add `@types/qrcode` to devDependencies
- Ensure Supabase client handles missing env vars gracefully (fallback so the page at least renders)

### Step 2: Connect Supabase
- Connect this project to Supabase (same backend as Arubaito or a new project)
- This provides the env vars needed for the client

### Step 3: Copy edge functions and migrations
- This is where your offer to "paste them here" would be most helpful — the `supabase/functions/` directory needs all Rei-related edge functions (`rei-chat`, `twitter-oauth`, `submit-rei-registration`, `check-rei-registration`, `verify-sol-payment`, etc.)
- Database migrations need to be created for the schema

## Recommendation

**You should paste the edge functions and migrations from the Arubaito project.** The frontend is done, but the backend (`supabase/` folder) is completely empty and those functions are 1700+ lines each — they need to come from the source. After you paste them, I'll integrate everything.

For now, I'll fix the build so the UI at least renders, then we connect Supabase and add the backend.

