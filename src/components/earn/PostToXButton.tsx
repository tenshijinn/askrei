import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const CHARS = '01#$%&*<>/\\|=+ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LABEL = 'Post to X';

interface Props {
  /** element to snapshot into the tweet image */
  targetRef: React.RefObject<HTMLElement>;
  /** tweet body text */
  buildText: () => string;
}

export default function PostToXButton({ targetRef, buildText }: Props) {
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

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const node = targetRef.current;
      if (node) {
        const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#0b0a09', cacheBust: true });
        const blob = await (await fetch(dataUrl)).blob();
        // copy to clipboard so it can be pasted straight into the X composer
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
          /* clipboard unsupported — the download below is the fallback */
        }
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'rei-bounty-dca.png';
        a.click();
      }
    } catch {
      /* image is a bonus — still open the composer */
    } finally {
      setBusy(false);
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildText())}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
