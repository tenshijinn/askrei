# Blog page for rei.chat

## What gets built

A simple, public blog at `/blog` with two posts seeded from the two uploaded research reports.

### Layout suggestion (index `/blog`)

```text
┌──────────────────────────────────────────────┐
│  RESEARCH / BLOG            (kicker + rule)  │
│  Onchain notes from Rei                      │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ AUG 2026 · ONCHAIN RESEARCH            │  │
│  │ The Airdrop That Held — $ANSEM         │  │
│  │ One-line summary of the note...        │  │
│  │ Read →                                 │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ AUG 2026 · ONCHAIN RESEARCH            │  │
│  │ Give It Away, Watch It Leave           │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

- Single centered column (max ~900px), dark background, cream text, peach accent — same palette the reports already use, so the blog and the posts feel like one product.
- Each entry is a bordered card: mono kicker (date · category), title, one-sentence excerpt, "Read →".
- Back link at the top of each post returns to `/blog`.

### Posts

- `/blog/the-airdrop-that-held` — the $ANSEM case study (how wallet scoring kept an airdropped token above ~$100M).
- `/blog/give-it-away-watch-it-leave` — six DeFi projects, token-funded vs cash-funded growth, and whether airdrop recipients stayed.

Both reports are self-contained documents with their own typography, tables, and animated charts. They will be kept intact rather than rewritten, so the charts and layout survive exactly as designed.

## Technical notes

- Copy the two uploaded HTML files into `public/blog/` as static documents (`ansem-case-study.html`, `holder-retention.html`), unchanged apart from making the backgrounds transparent-safe if needed.
- New `src/pages/Blog.tsx` — index page, driven by a small local `posts` array (slug, title, date, category, excerpt, file path). No database needed.
- New `src/pages/BlogPost.tsx` — reads `:slug`, renders the header/back link and embeds the matching static document in a full-width auto-resizing iframe (height synced via a `postMessage`/`ResizeObserver` snippet, so there is no inner scrollbar). Unknown slug → 404.
- Routes added in `src/App.tsx`: `/blog` and `/blog/:slug`, both public.
- Add the two post URLs to `scripts/generate-sitemap.ts` so they get indexed, and set per-post `<title>`/meta description client-side.

## Out of scope

- No CMS, admin editor, or database-backed posts (can be added later if you want to publish without a deploy).
