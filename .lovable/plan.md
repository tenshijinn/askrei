# Fix the /earn "Post to X" share

## What's actually wrong

Two separate problems, both confirmed just now:

1. **The share page can never work on that URL.** The functions gateway rewrites the response: the page is returned as `content-type: text/plain` with `content-security-policy: default-src 'none'; sandbox`. That's why you saw raw HTML source and mangled characters (`â€”`) — and it also means X's crawler will never read the Open Graph tags from it. The plan assumed `rei.chat/functions/v1/*` proxied to the backend; it does not — that path returns the normal app HTML, so the button had to fall back to the raw backend domain. Hence the scam-looking link.
2. **The desktop button does nothing.** `window.open` runs after several `await`s (render PNG, upload), so the browser no longer treats it as a user gesture and silently blocks the popup.

## The better way

Stop sending people to an intermediate page. The tweet should link to **rei.chat** itself, and the image should be attached to the tweet as a real file.

New flow when the button is clicked:

1. Open the X compose tab immediately (synchronous, so it's never blocked) — desktop only.
2. In the background, render the card PNG and save the share state, returning a short id.
3. Tweet text + link `https://rei.chat/earn?share=<id>` — a real page on your own domain that restores the exact calculator state, which already works.
4. The PNG is placed on the clipboard, and the button confirms "Image copied — paste into the tweet". One Cmd/Ctrl+V and the image is in the post.
5. On mobile, unchanged and better: the OS share sheet attaches image + text + link in one tap.
6. The intermediate `share-card` page and the raw backend URL disappear from anything a user sees.

Net result: trusted rei.chat link, working button, image in the tweet, no redirect page.

## What changes

- **`PostToXButton.tsx`**: open the compose window up front and navigate it once the id is ready; write the PNG to the clipboard (`ClipboardItem`) with a download fallback for browsers that refuse; button label reflects state ("Rendering…" → "Image copied — paste it in").
- **`earn-share` function**: return `https://rei.chat/earn?share=<id>` as the share URL instead of the backend `share-card` URL.
- **`share-card` function**: no longer used for sharing. Keep only its `?json=1` branch (that's what restores state on `/earn?share=`), or leave it as-is and simply stop linking to the HTML page.
- **`index.html`**: make sure the sitewide title/description and social preview are accurate, since `rei.chat/earn` is now what gets unfurled.
- No database or storage changes; the stored PNG is still used, just delivered via clipboard/native share rather than as a crawler-facing og:image.

## One honest limitation

A per-share image rendered by X's own link preview isn't possible on this stack — the app is a static single-page site, so crawlers only ever see the one static `<head>`, and the backend function route can't serve HTML the crawler will parse. That's why the image goes into the tweet as an attachment instead. If you want X to unfurl a unique image per share automatically, the app would need server-side rendering — that's available by upgrading to Lovable's latest template ([what the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)); happy to do that separately.
