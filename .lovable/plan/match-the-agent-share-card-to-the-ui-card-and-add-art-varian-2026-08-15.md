# Match the agent share card to the UI card, and add art variants

Two changes: the server-rendered card (what Hermes gets) becomes a faithful copy of the card users get from /earn, and the background art becomes context-aware — 16 slots keyed off the selected asset and DeFi platform, shared by both cards.

## 1. Agent card = UI card

The agent card is currently its own simple 1200x630 layout. It gets rebuilt to the same design as the on-page card:

- 1600x900 (16:9), dark background, diagonal-seam art panel on the right with the fade gradient
- Rei logo + "REI › Bounties › DeFi" breadcrumb
- $ASSET on PLATFORM row with the real asset and platform logos
- Big accent percentage, "$final · from $invested"
- Bounties Earned / DeFi Invested Bounties / Window stat rows
- Sparkline (value line, dashed contribution line, filled area) across the card
- @AskRei_ / rei.chat creds and the bottom-right "Find crypto's bounties aggregated by Rei AI" chip

Since the server renders SVG (no browser), the background art, Rei logo, asset logo, and platform logo are fetched and embedded as base64 in the SVG before rasterising, with a graceful fallback to the plain panel if a fetch fails. Colours, spacing and copy mirror `ShareImage.tsx` so the two cards read as the same asset.

## 2. Context-aware background art

One shared picker decides which art to use, used by both the on-page card and the agent card:

| Selection | Art |
| --- | --- |
| SOL + any DeFi platform | current art (`rei-share-art.png`) |
| USDC / USDT / BTC / ETH + DeFi platform | 1 of 5 images, one per platform (Jito, Kamino, Marinade, MarginFi, NLO) |
| Custom token from the token list | random pick from 10 images (2 per platform) |
| Buy & hold (no platform) | current art |

The random token pick is seeded from the share id / inputs so the same share always regenerates the same image (the share page and the posted PNG can't disagree).

## 3. Image slots

I'll build the picker first with all 16 slots named and wired, each falling back to the current art until you upload. Slot names you'll fill:

```text
sol-default                 (existing rei-share-art.png)
listed-jito, listed-kamino, listed-marinade, listed-marginfi, listed-nlo
token-jito-1, token-jito-2
token-kamino-1, token-kamino-2
token-marinade-1, token-marinade-2
token-marginfi-1, token-marginfi-2
token-nlo-1, token-nlo-2
```

Drop the images in chat named like the slots (or just tell me which is which) and I'll upload them to the CDN and swap the pointers — no other code changes needed at that point.

## Technical notes

- New `src/components/earn/shareArt.ts`: slot map (`.asset.json` pointers) + `pickShareArt({ asset, platform, isCustomToken, seed })`. Used by `ShareImage.tsx`.
- New `supabase/functions/_shared/earn-art.ts`: the same mapping, resolving to absolute `https://rei.chat/__l5e/...` URLs so the edge function can fetch them.
- `supabase/functions/_shared/earn-card.ts` rewritten: 1600x900 SVG matching `ShareImage`, base64-embedded raster images, resvg render unchanged.
- `earn-agent` `/share` keeps its response shape (`share_url`, `image_url`, `post_text`); only the pixels change. Existing stored cards are untouched.
- Verified after deploy by generating a card for SOL+Jito, USDC+Kamino, and a custom token, and comparing against the on-page card.
