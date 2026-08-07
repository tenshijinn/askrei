import { useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import caret from '@/assets/lottie/caret.json';
import scanline from '@/assets/lottie/scanline.json';
import loader from '@/assets/lottie/loader-dots.json';

interface Props {
  label: string;
  onAction?: () => void;
  className?: string;
}

export const LottieOverlayButton = ({ label, onAction, className = 'btn-manga btn-manga-primary' }: Props) => {
  const [hover, setHover] = useState(false);
  const [running, setRunning] = useState(false);
  const scanRef = useRef<LottieRefCurrentProps>(null);

  const handleEnter = () => {
    setHover(true);
    scanRef.current?.goToAndPlay(0, true);
  };
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
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHover(false)}
      onClick={handleClick}
      style={{
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        minWidth: 220,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hover && !running && (
        <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Lottie lottieRef={scanRef} animationData={scanline} loop={false} autoplay={false} style={{ width: '100%', height: '100%' }} />
        </span>
      )}
      {running ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', height: 20 }}>
          <Lottie animationData={loader} loop autoplay style={{ width: 60, height: 20 }} />
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
          {label}
          <Lottie animationData={caret} loop autoplay style={{ width: 10, height: 20 }} />
        </span>
      )}
    </button>
  );
};
