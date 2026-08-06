# Dynamic OG card for /earn shares — what's possible and the route I recommend

## The blocker, stated plainly

Verified just now:

- `https://rei.chat/functions/v1/share-card?id=...` does **not** reach the backend — Lovable hosting returns the normal app HTML for that path. There is no proxy from rei.chat to backend functions.
- The backend function's own URL returns the page as `content-type: text/plain` with `content-security-policy: default-src 'none'; sandbox`. That's the platform refusing to serve HTML from that domain (anti-phishing). It's why you saw raw source and mangled dashes — and it means X's crawler would never parse those tags even if the URL looked nice.

So the current architecture cannot produce a dynamic Twitter card, on either domain. Not a bug to patch — a dead end.

## What dynamic OG on rei.chat actually requires

X's crawler doesn't run JavaScript. It reads the HTML the server sends. This app is a static single-page site: every URL ships the same `index.html` head, so `rei.chat/s/xyz` can never carry per-share tags today.

The one real fix is server-side rendering — the app renders `rei.chat/s/<id>` on the server, injects that share's title, description and `og:image`, and serves it to crawler and human alike. Lovable supports this by upgrading the project to the latest template (TanStack Start): [what the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start). With SSR, everything on your list works exactly as described:

1. Form state kept — stored per share id, restored on load.
2. `og:image` is the rendered calculator PNG for that specific share.
3. `rei.chat/s/xyz` — short, on your domain, opens the calculator prefilled.

Option 3-alternative (long URL encoding the config, then shortened) is worth skipping: a self-describing short id in the database is simpler, shorter, and lets the image live alongside it. Encoding config in the URL buys nothing here and makes links ugly again.

## What I'd do, in two stages

**Stage 1 — ship now, no migration.** Everything except the crawler-visible head, built so nothing is thrown away later:

- Pretty share URLs: `rei.chat/s/<id>`, a real client route that loads the saved state and shows the calculator prefilled. Humans get a clean, trustworthy link on your domain — no redirect page, no backend URL.
- `earn-share` returns `https://rei.chat/s/<id>` instead of the backend URL.
- The rendered PNG goes into the tweet as an actual image: native share sheet on mobile, clipboard-copy with a "paste it in" prompt on desktop (the desktop button also gets fixed — it's currently blocked because `window.open` fires after several awaits, so the browser drops the user gesture).
- Retire the `share-card` HTML page; keep only its JSON branch used for state restore.

**Stage 2 — the migration.** Move to the SSR template, then `rei.chat/s/<id>` renders server-side with that share's OG/Twitter tags pointing at the stored PNG. Tweeting the link alone then unfurls a large dynamic card, and the clipboard step becomes unnecessary.

## My recommendation

Do Stage 1 now — it removes the scam-looking link, fixes the broken button, and gets an image into the tweet today. Then decide on the migration; it's the only path to a true dynamic Twitter card, and Stage 1's data model and share ids carry over unchanged.

Tell me if you'd rather go straight to the migration and do both in one pass.
