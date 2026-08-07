import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

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
  /** card state (unused by the dropdown flow, kept for callers) */
  buildState?: () => ShareState;
}

export default function PostToXButton({ targetRef, buildText }: Props) {
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loading = open && !img && !failed;

  const renderPng = async (): Promise<string | null> => {
    const node = targetRef.current;
    if (!node) return null;
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map(
          (i) =>
            new Promise<void>((resolve) => {
              if (i.complete) return resolve();
              i.addEventListener('load', () => resolve(), { once: true });
              i.addEventListener('error', () => resolve(), { once: true });
              window.setTimeout(resolve, 4000);
            }),
        ),
      );
      const filter = (n: HTMLElement) =>
        !(n instanceof HTMLImageElement && n.complete && n.naturalWidth === 0);
      const opts = { backgroundColor: '#0b0a09', filter } as const;
      await toPng(node, { ...opts, pixelRatio: 1 });
      return await toPng(node, { ...opts, pixelRatio: 1.5 });
    } catch (err) {
      console.error('share image render failed', err);
      return null;
    }
  };

  // render (or re-render) whenever the panel opens
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setImg(null);
    setFailed(false);
    (async () => {
      const url = await renderPng();
      if (!alive) return;
      if (url) setImg(url);
      else setFailed(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copy = async () => {
    if (!img) return;
    try {
      const blob = await (await fetch(img)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Card image copied — paste it into the tweet (⌘V)');
    } catch {
      toast.error('Clipboard images not supported here — use Download');
    }
  };

  const download = () => {
    if (!img) return;
    const a = document.createElement('a');
    a.href = img;
    a.download = 'rei-bounty-earnings.png';
    a.click();
    toast('Card image saved');
  };

  const post = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildText())}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="post-x-wrap" ref={wrapRef}>
      <button
        type="button"
        className="post-x"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Share this backtest to X"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
        <span>Share to X</span>
      </button>

      {open && (
        <div className="post-x-pop" role="dialog" aria-label="Share card">
          <div className="post-x-preview">
            {img ? (
              <img src={img} alt="Share card preview" />
            ) : failed ? (
              <div className="post-x-load">Couldn't render the card</div>
            ) : (
              <div className="post-x-load">
                <div className="post-x-bar"><i /></div>
                <span>Loading your share card</span>
              </div>
            )}
          </div>

          <div className="post-x-acts">
            <button type="button" className="post-x-act" onClick={copy} disabled={!img}>
              {loading ? 'Loading' : 'Copy'}
            </button>
            <button type="button" className="post-x-act" onClick={download} disabled={!img}>
              {loading ? 'Loading' : 'Download'}
            </button>
            <button
              type="button"
              className="post-x-act post-x-act-primary"
              onClick={post}
              disabled={loading}
            >
              {loading ? 'Loading' : 'Post to X'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
