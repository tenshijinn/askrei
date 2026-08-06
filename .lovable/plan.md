# Fix the /earn share card: Open Graph link-card + mobile native share

The current button tries to attach a PNG to X's tweet intent. That can't work — `twitter.com/intent/tweet` has no media parameter. Replacing it with the OG link-card pattern, plus the Web Share API on mobile.

## How it will work

1. User clicks **Post to X** on the calculator card.
2. The app renders the existing 1600x900 share graphic to a PNG in the browser (already built), uploads it to a public storage bucket, and saves the card's state (asset, platform, amount, window, earned, final value, %) as a short share ID.
3. On mobile, if the device supports native file sharing, the OS share sheet opens with the image + text attached — one tap into X.
4. Everywhere else, X opens prefilled with the tweet text plus a share link: `https://rei.chat/functions/v1/share-card?id=<shortId>`.
5. That link is served by a backend function that returns real HTML with Open Graph / Twitter meta tags pointing at the uploaded PNG, so X renders a large image card. Humans hitting the link get bounced straight to `/earn` with the same state prefilled.

Result: one click, a big image in the tweet, and a clickable link back to rei.chat that carries the referral — which the file-attachment approach never gave us.

## What changes

- **New public storage bucket** for rendered share images (immutable, cache-friendly filenames).
- **New table `earn_shares`**: short id, card state JSON, image path, created_at. Public read of non-sensitive columns, writes only through the function.
- **New backend function `earn-share`**: accepts the card state + PNG, stores both, returns the short id and share URL.
- **New backend function `share-card`**: `GET ?id=<shortId>` returns static HTML containing `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card=summary_large_image`, `twitter:image`, plus a redirect for real visitors to `/earn?share=<id>`.
- **`PostToXButton.tsx`**: drop the clipboard/download fallback path as the primary flow; render PNG → upload → then either native share (mobile) or intent-with-URL (desktop). Keep a graceful text-only tweet if upload fails.
- **`BountyDefiCard.tsx`**: append the share URL to the tweet text; read `?share=` on load to restore state when someone arrives from a shared link.
- **`ShareImage.tsx`**: unchanged layout; ensure fonts and the Rei art are loaded and CORS-safe before capture so the PNG never comes out blank.

## Technical notes

- This project is a client-side Vite SPA, so meta tags injected by React are invisible to Twitterbot. Serving the share page from an edge function is what makes the crawler see the tags. `rei.chat/functions/v1/*` already proxies to backend functions (the MCP server uses it), so the share URL stays on the rei.chat domain — I'll confirm the proxy responds for the new function before wiring the button to it.
- Rendering happens client-side with the existing `html-to-image` code rather than adding a server-side Satori/Playwright renderer — the graphic is already built and validated, and uploading the finished PNG gives X a stable, cacheable image URL.
- Each share gets a unique id, so X's per-URL image cache never serves one user's numbers to another.
- No `_redirects`-style hosting config is involved; nothing in the existing `/earn` layout or copy changes.
