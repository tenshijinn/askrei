import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  onAction?: () => void;
  className?: string;
}

export const TypewriterButton = ({ label, onAction, className = 'btn-manga btn-manga-primary' }: Props) => {
  const [display, setDisplay] = useState(label);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const typeOut = (text: string, speed = 32) => {
    clearTimers();
    setDisplay('');
    [...text].forEach((_, i) => {
      timers.current.push(setTimeout(() => setDisplay(text.slice(0, i + 1)), i * speed));
    });
  };

  const handleEnter = () => {
    if (running || reduced) return;
    typeOut(label);
  };
  const handleLeave = () => {
    if (running) return;
    clearTimers();
    setDisplay(label);
  };

  const handleClick = () => {
    if (running) return;
    setRunning(true);
    clearTimers();
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
      <span>{display}</span>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '0.55em',
          marginLeft: 2,
          background: 'currentColor',
          animation: 'tw-blink 0.9s steps(1) infinite',
          height: '1em',
          verticalAlign: '-2px',
        }}
      />
      <style>{`@keyframes tw-blink { 50% { opacity: 0; } }`}</style>
    </button>
  );
};
