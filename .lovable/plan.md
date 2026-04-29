## Overview

Two coordinated updates while we wait for Stripe to come back online:

1. **Pricing tier rename + marketing copy** on the landing-page packages section.
2. **Monthly / Yearly toggle** on `/unlimited-posts` ($99/mo or $999/yr — 15.9% off) wired through to the Stripe checkout flow so it's ready the moment Stripe is healthy again.

No Coinbase work — Stripe stays as the payment rail; we're just preparing the new pricing structure.

---

## 1. Stripe price for the yearly plan

Add a new yearly recurring price alongside the existing `unlimited_posts_monthly`:

- `unlimited_posts_monthly` — $99 / month (already exists)
- `unlimited_posts_yearly` — $999 / year (new) → effectively $83.25/mo, ~15.9% off vs $99×12

Created via the payments tool — no manual Stripe dashboard work needed. Both prices live under the same `unlimited_posts` product so existing webhook logic (`md.product_id === "unlimited_posts"`) keeps working unchanged.

---

## 2. `/unlimited-posts` page — billing toggle

Add a Monthly / Yearly toggle directly above the price line in the form panel.

```text
                  ┌───────────────┬──────────────┐
                  │   Monthly     │ Yearly  -16% │
                  └───────────────┴──────────────┘

   Payment:  $99 p/m            (or)   $999 /yr
   Just $3.30 per day                  Just $2.73 per day · save 15.9%
   ─────────────────────────────       ─────────────────────────────
   [        START SUBSCRIPTION        ]
```

Behaviour:
- Toggle state (`monthly` | `yearly`) drives which `priceId` is sent to `StripeEmbeddedCheckout` (`unlimited_posts_monthly` vs `unlimited_posts_yearly`).
- Per-day marketing line updates with the toggle ($3.30/day or $2.73/day · 15.9% off).
- The "STRIPE / MONTHLY SUBSCRIPTION" badge becomes "STRIPE / MONTHLY" or "STRIPE / YEARLY".
- Selected plan is persisted into the Stripe checkout `metadata.billing_interval` so it shows up in the webhook + `campaign_subscriptions` row.
- Bullet copy under "How it works" updated: "Subscription renews monthly or yearly via Stripe. Cancel anytime — sync stops at period end."

No webhook changes required — the existing handler picks up `current_period_end` from the subscription regardless of interval, so `campaign_subscriptions.expires_at` will correctly read 1 month or 1 year out.

---

## 3. Landing page packages (`JoinReiPricing.tsx`) — rename + subtitles

Rename and add subtitles to all three tiers. Per-day copy added under price.

| Old name | New name | Subtitle | Price line |
|---|---|---|---|
| Posts | **Community Growth Engine** · `x10 Leverage` | 1 Promotion Post | $5 / per post |
| Unlimited Posts | **<span class="pulse">Automated</span> Community Growth Engine** · `x10 Leverage` | Unlimited Promotion Posts | $99/mo *(toggle to $999/yr)* — "Just $3.30/day" / "Just $2.73/day · save 15.9%" |
| Rocket Reach | **Rocket Reach** · `Community Growth Engine x100 Leverage` | 1 Promotion Campaign | $2,500 / per campaign |

**"Automated" glow effect** — soft pulse using a CSS keyframe (text-shadow on the primary accent), brighter→softer on a 2.4s loop. Inline `<span className="pulse-glow">Automated</span>` so only that word animates.

**Updated USP list for "Automated Community Growth Engine"** to reflect current functionality (replacing the older "Unlimited Posts" bullet list):
- Auto-scrape & re-sync of your campaign tasks across Galxe, Zealy, QuestN, TaskOn, Layer3, custom
- API ingestion — drop a link, Rei keeps it fresh
- Auto-categorisation by skill, chain, payout type
- Continuous matching to skill-aligned wallets via AskRei + Agent Rei
- Cross-chain reach (Solana, Ethereum, Polygon, Arbitrum, Base)
- Reduced contributor overlap & priority freshness
- Basic performance insights (tasks indexed, sync cycles, last sync)
- Monthly OR yearly billing — yearly saves 15.9%

The "Unlimited Posts" CTA on this card already routes to `/unlimited-posts` — no routing change needed; users land on the same page where they pick monthly/yearly.

---

## Technical notes

**Files touched**
- `src/pages/UnlimitedPosts.tsx` — add `interval` state, toggle UI, dynamic priceId/copy.
- `src/components/joinrei/JoinReiPricing.tsx` — rename tiers, add subtitles, swap "Unlimited Posts" USP list, route Unlimited button still → `/unlimited-posts`.
- `src/index.css` — add `.pulse-glow` keyframe (soft brighter↔softer text-shadow loop on the primary accent).
- Payments tool call: create `unlimited_posts_yearly` price ($999/yr, recurring=year, qty 1/1) under the existing `unlimited_posts` product.

**No DB/migration changes.** Webhook + `campaign_subscriptions` schema already handle any interval.

**Stripe-down note.** Per your message we're not switching providers — once Stripe checkout is healthy again, the new yearly price is already live and the toggle just works. If you want a temporary "Subscriptions paused" banner on `/unlimited-posts` while Stripe is down, say the word and I'll add it.