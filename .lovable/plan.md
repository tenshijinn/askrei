# Dynamic Twitter card for /earn shares — static pre-baked share page

Stays a client-side Vite/React SPA. No SSR, no TanStack Start migration.

## How it works

At click time the browser renders the existing 1600x900 share card to a PNG, sends it plus the tweet copy to a backend function, and gets back a URL to a tiny static HTML file that already contains the Twitter/OG tags in its raw source. That URL goes in the tweet, so X's crawler (which does not run JavaScript) reads real tags and renders a large image card. Humans who click the card are redirected to `rei.chat/s/<id>`, which opens the calculator with that exact result restored.

```text
click → render PNG → create-share fn → uploads <id>.png + <id>.html
      → tweet url = .../share-cards/<id>.html
      crawler → reads meta tags → large image card
      human   → redirected to rei.chat/s/<id> (calculator prefilled)
```

Every share gets a fresh id, so URLs are immutable and X can never serve a stale cached image.

## What changes

1. **New public storage bucket `share-cards`** — public read so the crawler can fetch both files; all writes happen server-side only.
2. **New backend function `create-share`** — accepts the PNG (base64), title, description and redirect URL; uploads `<id>.png` (`image/png`) and `<id>.html` (`text/html`); returns `{ pageUrl, imageUrl }`. Includes CORS preflight, input validation, and a size cap on the PNG.
3. **Share state persistence stays as-is** — the existing `earn_shares` row is still written so `rei.chat/s/<id>` can restore the calculator. The same short id is used for the storage files, keeping page, image and state aligned.
4. **`PostToXButton` rewired** — it keeps its current rendering path (`html-to-image` on the off-screen `ShareImage` node, which already handles font readiness, image preloading and CORS-proxied logos) and swaps the link it tweets for the new `<id>.html` URL. Mobile still gets `navigator.share({ files })` first for a native image attach; desktop opens the intent with the pre-baked page URL and no longer needs the clipboard-paste prompt.
5. **Legacy `share-card` function** — keeps only its JSON branch used for state restore; its redirect stays for old links.

## Tweet copy

Unchanged framing: Rei finds/discovers bounties, never "earn on Rei". Text stays the current 4-step body; the appended link becomes the static share page.

- `twitter:title`: `$<final value> from crypto bounties · Rei`
- `twitter:description`: `Bounty DCA backtest: $<ASSET> on <platform> · <window>. Find 1,000+ bounties on Rei.`
- `twitter:card`: `summary_large_image`, image 1600x900

## Technical notes

- The intent URL only carries `text` and `url` — the image is delivered purely via the OG card, as required.
- Files are written with explicit content types; the HTML file's redirect is a `location.replace` in a `<script>`, invisible to the crawler.
- All URLs absolute `https://`; PNG stays well under 5 MB at 1600x900.
- Desktop popup blocking is avoided by keeping the tab opened synchronously on click before any awaits.

## Verification

1. Click Post to X → compose window opens with prefilled text and a `.../share-cards/<id>.html` link.
2. That URL in X's card validator / a fresh tweet renders a large image of that exact result.
3. Clicking the card lands on `rei.chat/s/<id>` with the calculator prefilled.
4. Two different results produce two different image cards.
