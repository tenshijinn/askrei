import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const CHARS = '01#$%&*<>/\\|=+ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LABEL = 'Post to X';

const SHARE_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/earn-share`;
const SHARE_HEADERS = {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
  targetRef: React.RefObject<HTMLElement>;
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
      // render twice — the first pass warms images/fonts in the clone
      await toPng(node, { pixelRatio: 1, backgroundColor: '#0b0a09', cacheBust: true });
      return await toPng(node, { pixelRatio: 1.5, backgroundColor: '#0b0a09', cacheBust: true });
    } catch {
      return null;
    }
  };

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const body = buildText();

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
    try {
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData & { files?: File[] }) => boolean;
      };
      if (dataUrl && nav.share) {
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

    setBusy(false);
    // Desktop: tweet the share link — X renders it as a large image card.
    const params = new URLSearchParams({ text: body });
    if (shareUrl) params.set('url', shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
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
