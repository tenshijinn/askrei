## Goal

Three fixes to the Rei chat experience and data layer:

1. Stop Rei from telling logged-in users to "register" with a bogus `app.rei.xyz/profile` link.
2. Replace the generic `UserCircle` profile icon in the top-right with the user's X (Twitter) avatar.
3. Correct the malformed Superteam URLs (`/listings/` → `/listing/`) in the tasks table and prevent the bad pattern in future syncs.

---

## Root cause of the bad reply

The user pasted:
> "register and create a profile so I can better match you with opportunities? Register → https://app.rei.xyz/profile"

What actually happened:
- The chatbot called the `search_jobs` tool, which invokes a Supabase Edge Function `match-talent-to-jobs`.
- **That edge function does not exist** in this project (`supabase/functions/match-talent-to-jobs/` is missing). The invoke fails silently and returns an empty/error payload.
- Receiving "no jobs", the model fell back to the system-prompt rule (line 478): *"If search returns 'profile not found': Include {action:'register', link:'/rei'}"* — and hallucinated the domain (`app.rei.xyz/profile`) because the rule is too vague.
- The user is, in fact, already registered (they're inside the chat), so this branch should never trigger for them.

---

## Plan

### 1. Fix `search_jobs` and the "no results" guidance (`supabase/functions/rei-chat/index.ts`)

- Reimplement `case 'search_jobs'` inline (mirroring `search_tasks` at line 1029) instead of calling the missing `match-talent-to-jobs` function. It will:
  - Look up the talent in `rei_registry` by wallet.
  - If the registry row is missing, return `{ error: 'profile_missing' }`.
  - Otherwise query `jobs` (or `tasks` filtered to job-like `opportunity_type`s — confirm against schema during implementation) for active rows, score them against `talent.skill_category_ids` / `role_tags`, and return top matches.
- Update the system prompt (around lines 476–478) to be explicit and accurate:
  - Remove the "register / link:/rei" instruction entirely (registered users should never see it).
  - Add: *"If a search returns zero matches for a registered user, do NOT suggest registering. Suggest they enrich their profile by tapping the profile avatar (top-right) → Edit Profile, and add more skills / portfolio links so Rei can match more opportunities. Never invent URLs — only link to in-app routes (`/rei`)."*
  - Reinforce: *"The user is already authenticated and registered if you can talk to them."*

### 2. Use the X profile avatar in the top-right (`src/pages/Rei.tsx`, line 237)

- Replace the `<UserCircle>` icon button with:
  - If `twitterUser?.profile_image_url` is present → render the avatar `<img>` (circular, ~22px, with a subtle ring when `activeTab === 'profile'`).
  - Fallback to current `UserCircle` icon if no avatar is loaded yet.
- Keep click behavior identical (`setActiveTab('profile')`) and preserve `title="Profile"` for accessibility.

### 3. Correct Superteam URLs

Two parts:

**a. Backfill existing rows** — migration that runs:
```sql
UPDATE public.tasks
SET link = REPLACE(link, 'earn.superteam.fun/listings/', 'earn.superteam.fun/listing/')
WHERE link ILIKE 'https://earn.superteam.fun/listings/%';
```
(3 rows currently affected, confirmed via DB query.)

**b. Defensive fix in the sync function** (`supabase/functions/sync-drive-tasks/index.ts`)
- In `mapBounty`, normalize the URL before storing: if `b.url` matches `earn.superteam.fun/listings/`, rewrite to `/listing/`. This protects against the upstream Drive JSON continuing to ship the wrong slug.

---

## Files to change

- `supabase/functions/rei-chat/index.ts` — rewrite `search_jobs` handler; tighten system-prompt "no results" guidance.
- `src/pages/Rei.tsx` — swap top-right profile icon for X avatar.
- `supabase/functions/sync-drive-tasks/index.ts` — normalize Superteam URL in `mapBounty`.
- New migration — `UPDATE` to fix the 3 existing bad Superteam URLs.

## Out of scope / safety

- No changes to `MessageContent.tsx`, `TaskPreviewCard.tsx`, `useTaskPreview.ts`, or any other Rei dependency — the cards, registration flow, and chat history all keep working.
- No schema changes; only data backfill + edge-function logic.
