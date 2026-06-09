import { useEffect, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import loader from '@/assets/lottie/loader-dots.json';

interface Props {
  label: string;
  onAction?: () => void;
  className?: string;
}

/**
 * "Full Lottie label" — the label text is rendered as an SVG path that animates its
 * stroke-dashoffset on hover (programmatic Lottie-like animation), and a real Lottie
 * loader replaces it on click. This avoids hand-authoring a separate .json per label
 * while still demonstrating the "label-as-animation" pattern.
 */
export const FullLottieLabelButton = ({ label, onAction, className = 'btn-manga btn-manga-primary' }: Props) => {
  const [running, setRunning] = useState(false);
  const [hover, setHover] = useState(false);
  const textRef = useRef<SVGTextElement>(null);
  const [len, setLen] = useState(600);

  useEffect(() => {
    if (textRef.current) {
      try {
        const l = (textRef.current as any).getComputedTextLength?.() ?? 600;
        setLen(l + 40);
      } catch {}
    }
  }, [label]);

  const handleClick = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      onAction?.();
    }, 250);
  };

  return (
    <button
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleClick}
      style={{
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        minWidth: 220,
        padding: '0 24px',
      }}
    >
      {running ? (
        <Lottie animationData={loader} loop autoplay style={{ width: 60, height: 20, display: 'inline-block' }} />
      ) : (
        <svg viewBox="0 0 220 28" height="20" style={{ display: 'block', margin: '0 auto' }}>
          <text
            ref={textRef}
            x="110"
            y="20"
            textAnchor="middle"
            fontFamily='ui-monospace, "SF Mono", Menlo, monospace'
            fontSize="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            style={{
              strokeDasharray: len,
              strokeDashoffset: hover ? 0 : len,
              transition: 'stroke-dashoffset 700ms ease-out, fill 700ms ease-out 300ms',
              fill: hover ? 'currentColor' : 'transparent',
            }}
          >
            {label}
          </text>
        </svg>
      )}
    </button>
  );
};
