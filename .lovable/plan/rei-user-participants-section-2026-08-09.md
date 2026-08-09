# Rei User Participants section

Add a collapsible "Rei User Participants" section directly below the existing Impressions/Clicks dashboard (rendered by `BountyPromotions` on the Rei page). The existing dashboard is untouched.

## What the user sees

Collapsed by default: a card header reading **Rei User Participants**, a live count ("6 members" today), and a chevron that rotates on open.

Expanded, top to bottom:

1. **Search bar** — live filter across display name, X handle, and both wallet addresses (case-insensitive, partial match).
2. **Sort row** — label "Sort by" with four toggles: Diamond Score, Community, Confidence, Trust. Clicking sorts highest-first and shows an active highlight plus a descending arrow; clicking again turns it off and returns to the default order (Diamond Score desc, then newest). Only one sort active at a time.
3. **Export CSV** — right-aligned on the sort row, peach outline. Exports exactly the rows currently shown, in the current order, with columns: name, handle, sol_wallet, evm_wallet, diamond_score, tier, community, confidence, trust.
4. **Participant cards** — one per member:
   - X profile picture on the far left, circular, with an initial-letter fallback when the image is missing or fails to load.
   - Display name + `@handle` with the peach diamond icon.
   - Large Diamond Score "NN /100" plus tier label.
   - Wallet chips: SOL address always, EVM address only when present, each truncated (`2gvg…HrBt`) with a small `SOL` / `EVM` network tag, and click-to-copy.
   - Metric chips: Community, Confidence, Trust.
5. Empty states: "No members yet" when the list is empty, and "No members match your search" when filtered to nothing. Skeleton rows while loading.

Cards stack their inner columns vertically on mobile, matching the reference's responsive behaviour.

## Data

Live data from our database `rei_registry`, not mock data.

- Name, handle, avatar, SOL wallet, EVM wallet, and the stored `diamond_score` / `diamond_tier` come straight from the record — we already compute and persist Diamond Scores, so no recomputation.
- Community and Confidence come from the stored wallet-behaviour subscores.
- **Trust** is not stored as its own subscore. It is derived as `100 − risk` from the stored risk subscore (risk 0 = fully trusted). Members with no wallet scan yet show "—" for score and metrics.
- Tier labels use our existing Diamond tiers (Coal, Emerald, Sapphire, Diamond, Rei's Diamond) rather than the reference file's placeholder tier names, so the section matches the rest of the app.

Note: no member currently has an EVM wallet saved, so the EVM chip will simply not render until someone connects one — the card handles both cases.

## Technical notes

Backend:

- New read-only view `public.v_public_rei_participants` over `rei_registry` exposing only the display fields listed above (handle, display name, avatar URL, `wallet_address`, `evm_wallet_address`, `diamond_score`, `diamond_tier`, and the `community` / `confidence` / `risk` subscores extracted from `wallet_behaviour`), ordered by score. `GRANT SELECT` to `anon` and `authenticated`, mirroring the existing `v_public_*` views. No emails, file paths, or raw analysis blobs are exposed.
- No new edge function needed; the client reads the view via the Supabase client.

Frontend:

- `src/components/rei/ReiParticipants.tsx` — the accordion, search, sort toggles, CSV export, and card list. Local state only; sorting and filtering happen client-side on the fetched rows (member count is small).
- `src/components/rei/ParticipantCard.tsx` — a single card (avatar, identity, score block, wallet chips, metric chips).
- Styling reuses the existing dark card tokens and the peach accent already in `index.css` / Tailwind config (`#e8b4a0` maps to the existing peach token) — no hardcoded colour utilities and no new palette entries.
- Rendered from `src/pages/Rei.tsx` immediately after `<BountyPromotions />` so it sits below the dashboard.
- Search is debounced; CSV is generated in-browser via a Blob download.
