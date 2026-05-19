import type { ReactNode } from 'react';

interface Props {
  text: ReactNode;
  videoSrc: string;
}

/**
 * Video template card body for the WalkthroughTour.
 * Left: descriptive text. Right: autoplay looping muted video.
 * Use with a wider cardWidth (e.g. 640-720) on the TourStep.
 */
export function WalkthroughVideoCard({ text, videoSrc }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
      <div style={{ color: '#a09e9a', fontSize: 12.5, lineHeight: 1.55 }}>{text}</div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '0.5px solid hsla(0,0%,100%,0.12)', background: '#0a0a0a', minHeight: 160 }}>
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
