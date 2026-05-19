import type { ReactNode } from 'react';

interface Props {
  text: ReactNode;
  videoSrc: string;
  layout?: 'side' | 'stacked';
}

/**
 * Video template card body for the WalkthroughTour.
 * - 'side' (default): text on the left, video on the right. Use cardWidth ~640-720.
 * - 'stacked': text on top, video below. Use a narrower cardWidth (~380-440).
 */
export function WalkthroughVideoCard({ text, videoSrc, layout = 'side' }: Props) {
  const isStacked = layout === 'stacked';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isStacked ? '1fr' : '1fr 1fr',
        gap: isStacked ? 10 : 14,
        alignItems: 'stretch',
      }}
    >
      <div style={{ color: '#a09e9a', fontSize: 12.5, lineHeight: 1.55 }}>{text}</div>
      <div
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          border: '0.5px solid hsla(0,0%,100%,0.12)',
          background: '#0a0a0a',
          minHeight: isStacked ? 180 : 160,
        }}
      >
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  );
}
