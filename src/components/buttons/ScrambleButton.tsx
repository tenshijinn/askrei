import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  onAction?: () => void;
  className?: string;
}

const GLYPHS = '!<>-_\\/[]{}—=+*^?#$%&@';

export const ScrambleButton = ({ label, onAction, className = 'btn-manga btn-manga-primary' }: Props) => {
  const [display, setDisplay] = useState(label);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);
  const stop = useRef(false);

  const cancel = () => {
    stop.current = true;
    if (raf.current) cancelAnimationFrame(raf.current);
  };

  useEffect(() => () => cancel(), []);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrambleTo = (target: string, duration = 600) => {
    cancel();
    stop.current = false;
    const start = performance.now();
    const tick = (now: number) => {
      if (stop.current) return;
      const p = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(p * target.length);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        if (i < revealCount || target[i] === ' ') out += target[i];
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const handleEnter = () => {
    if (running || reduced) return;
    scrambleTo(label);
  };
  const handleLeave = () => {
    if (running) return;
    cancel();
    setDisplay(label);
  };
  const handleClick = () => {
    if (running) return;
    setRunning(true);
    cancel();
    setDisplay('> running…');
    setTimeout(() => {
      setRunning(false);
      setDisplay(label);
      onAction?.();
    }, 250);
  };

  return (
    <button
      className={className}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', minWidth: 220 }}
    >
      {display}
    </button>
  );
};
