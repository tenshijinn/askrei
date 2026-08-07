import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const CHARS = '01#$%&*<>/\\|=+ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LABEL = 'Post to X';

const SHARE_FN = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/earn-share`;
const SHARE_HEADERS = {
  'Content-Type': 'application/json',
  apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
  Authorization: `Bearer ${import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]}`,
};

export interface ShareState {
  assetSym: string;
  platform: string | null;
  amount: number;
  frequency: string;
  period: string;
  invested: number;
  finalVal: number;
  windowLabel: string;
}

interface Props {
  /** element to snapshot into the share image */
  targetRef: React.RefObject<HTMLElement | null>;
  /** tweet body text */
  buildText: () => string;
  /** card state persisted with the share link */
  buildState: () => ShareState;
}

export default function PostToXButton({ targetRef, buildText, buildState }: Props) {
  const [text, setText] = useState(LABEL);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  const scramble = () => {
    if (timer.current) window.clearInterval(timer.current);
    let frame = 0;
    timer.current = window.setInterval(() => {
      frame += 1;
      setText(
        LABEL.split('')
          .map((c, i) => {
            if (c === ' ') return ' ';
            if (i < frame / 2) return LABEL[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(''),
      );
      if (frame / 2 >= LABEL.length) {
        window.clearInterval(timer.current!);
        timer.current = null;
        setText(LABEL);
      }
    }, 35);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setText(LABEL);
  };

  const renderPng = async (): Promise<string | null> => {
    const node = targetRef.current;
    if (!node) return null;
    try {
      if (document.fonts?.ready) await document.fonts.ready;

      // wait for every image in the card, then drop any that failed so a single
      // broken logo can't abort the whole capture
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
              window.setTimeout(resolve, 4000);
            }),
        ),
      );
      const filter = (n: HTMLElement) =>
        !(n instanceof HTMLImageElement && n.complete && n.naturalWidth === 0);

      const opts = { backgroundColor: '#0b0a09', filter } as const;
      // first pass warms the clone's images/fonts
      await toPng(node, { ...opts, pixelRatio: 1 });
      return await toPng(node, { ...opts, pixelRatio: 1.5 });
    } catch (err) {
      console.error('share image render failed', err);
      return null;
    }
  };


  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const body = buildText();

    // Open the tab up-front: popup blockers reject window.open once the click
    // gesture has been consumed by awaits.
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData & { files?: File[] }) => boolean;
    };
    const canNativeShare = typeof nav.share === 'function';
    const tab = canNativeShare ? null : window.open('', '_blank');

    const dataUrl = await renderPng();

    // Save the state + rendered image so the share link can serve an OG card.
    let shareUrl: string | null = null;
    try {
      const res = await fetch(SHARE_FN, {
        method: 'POST',
        headers: SHARE_HEADERS,
        body: JSON.stringify({ ...buildState(), image: dataUrl ?? undefined }),
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof json?.url === 'string') shareUrl = json.url;
      } else {
        console.error('earn-share failed', res.status, await res.text());
      }
    } catch (err) {
      console.error('earn-share error', err);
    }

    // Mobile: native share sheet attaches the real image file alongside the text.
    if (canNativeShare) {
      try {
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'rei-bounty-earnings.png', { type: 'image/png' });
          if (nav.canShare?.({ files: [file] })) {
            await nav.share({
              files: [file],
              text: shareUrl ? `${body}\n\n${shareUrl}` : body,
            });
            setBusy(false);
            return;
          }
        }
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') {
          setBusy(false);
          return;
        }
        /* fall through to the intent link */
      }
    }

    // Desktop: copy the PNG so it can be pasted straight into the composer.
    let copied = false;
    if (dataUrl) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copied = true;
      } catch {
        /* clipboard images unsupported — the link card still carries the image */
      }
    }
    toast(
      copied
        ? 'Card image copied — paste it into the tweet (⌘V)'
        : 'Tweet opened — the link unfurls your card',
    );

    setBusy(false);
    const params = new URLSearchParams({ text: body });
    if (shareUrl) params.set('url', shareUrl);
    const intent = `https://twitter.com/intent/tweet?${params.toString()}`;
    if (tab) tab.location.replace(intent);
    else window.open(intent, '_blank', 'noopener,noreferrer');
  };


  return (
    <button
      type="button"
      className="post-x"
      onMouseEnter={scramble}
      onMouseLeave={stop}
      onClick={handleClick}
      disabled={busy}
      aria-label="Post this backtest to X"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
      <span>{busy ? 'Rendering…' : text}</span>
    </button>
  );
}
