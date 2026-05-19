import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface TourStep {
  selector: string;
  title: string;
  body: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  onEnter?: () => void;
  cardWidth?: number;
  highlightPadding?: number;
}

interface Props {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

interface Rect { top: number; left: number; width: number; height: number; }

const PAD = 8;
const DEFAULT_CARD_W = 320;
const CARD_GAP = 14;

function findTarget(selector: string): HTMLElement | null {
  try { return document.querySelector(selector) as HTMLElement | null; } catch { return null; }
}

export function WalkthroughTour({ steps, open, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => { if (open) setIndex(0); }, [open]);

  // Resolve the first reachable step starting at `index`.
  const resolvedStep = useMemo(() => {
    if (!open) return null;
    for (let i = index; i < steps.length; i++) {
      if (findTarget(steps[i].selector)) return { ...steps[i], _i: i };
    }
    return null;
  }, [open, index, steps]);

  // Fire onEnter when the active step's index changes
  const lastEnteredRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) { lastEnteredRef.current = null; return; }
    const step = steps[index];
    if (step?.onEnter && lastEnteredRef.current !== index) {
      lastEnteredRef.current = index;
      step.onEnter();
    }
  }, [open, index, steps]);

  useLayoutEffect(() => {
    if (!open || !resolvedStep) { setRect(null); return; }
    const measure = () => {
      const el = findTarget(resolvedStep.selector);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    const t = setTimeout(measure, 350);
    const t2 = setTimeout(measure, 800);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t); clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, resolvedStep]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, steps]);

  if (!open) return null;

  if (!resolvedStep) {
    onClose();
    return null;
  }

  const total = steps.length;
  const currentIdx = resolvedStep._i;
  const isLast = currentIdx >= total - 1;
  const CARD_W = resolvedStep.cardWidth ?? DEFAULT_CARD_W;

  const next = () => {
    if (isLast) onClose();
    else setIndex(currentIdx + 1);
  };
  const prev = () => { if (currentIdx > 0) setIndex(currentIdx - 1); };

  const pad = resolvedStep.highlightPadding ?? PAD;
  const hr = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  let cardTop = 24, cardLeft = 24;
  if (hr) {
    const placement = resolvedStep.placement
      ?? (hr.top + hr.height + CARD_GAP + 220 < viewport.h ? 'bottom' : 'top');
    if (placement === 'bottom') {
      cardTop = hr.top + hr.height + CARD_GAP;
      cardLeft = Math.min(Math.max(hr.left + hr.width / 2 - CARD_W / 2, 12), viewport.w - CARD_W - 12);
    } else if (placement === 'top') {
      cardTop = Math.max(hr.top - CARD_GAP - 220, 12);
      cardLeft = Math.min(Math.max(hr.left + hr.width / 2 - CARD_W / 2, 12), viewport.w - CARD_W - 12);
    } else if (placement === 'right') {
      cardTop = Math.max(hr.top + hr.height / 2 - 100, 12);
      cardLeft = Math.min(hr.left + hr.width + CARD_GAP, viewport.w - CARD_W - 12);
    } else {
      cardTop = Math.max(hr.top + hr.height / 2 - 100, 12);
      cardLeft = Math.max(hr.left - CARD_GAP - CARD_W, 12);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483600 }}>
      {hr ? (
        <>
          <div onClick={onClose} style={panelStyle(0, 0, '100%', hr.top)} />
          <div onClick={onClose} style={panelStyle(0, hr.top, hr.left, hr.height)} />
          <div onClick={onClose} style={panelStyle(hr.left + hr.width, hr.top, `calc(100% - ${hr.left + hr.width}px)`, hr.height)} />
          <div onClick={onClose} style={panelStyle(0, hr.top + hr.height, '100%', `calc(100% - ${hr.top + hr.height}px)`)} />
          <div style={{
            position: 'fixed', top: hr.top, left: hr.left, width: hr.width, height: hr.height,
            borderRadius: 14, boxShadow: '0 0 0 2px #ed565a, 0 0 0 6px rgba(237,86,90,0.25)',
            pointerEvents: 'none', transition: 'all 180ms ease',
          }} />
        </>
      ) : (
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      )}

      <div
        role="dialog"
        aria-label="Walkthrough"
        style={{
          position: 'fixed', top: cardTop, left: cardLeft, width: CARD_W,
          background: '#141414', color: '#f0ede8',
          border: '0.5px solid hsla(0,0%,100%,0.12)',
          borderRadius: 14, padding: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          fontFamily: "'SF Mono', 'Consolas', monospace",
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: '#a09e9a', letterSpacing: '0.08em' }}>
            {currentIdx + 1} / {total}
          </span>
          <button onClick={onClose} style={{ fontSize: 11, color: '#a09e9a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Skip tour
          </button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#f0ede8', marginBottom: 6, fontFamily: 'inherit' }}>
          {resolvedStep.title}
        </div>
        <div style={{ fontSize: 12.5, color: '#a09e9a', lineHeight: 1.55, marginBottom: 14 }}>
          {resolvedStep.body}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {currentIdx > 0 && (
            <button onClick={prev} className="btn-manga btn-manga-outline" style={{ borderRadius: 24, padding: '7px 16px', fontSize: 12, cursor: 'pointer' }}>
              Back
            </button>
          )}
          <button onClick={next} style={{ borderRadius: 24, padding: '7px 18px', fontSize: 12, cursor: 'pointer', background: '#ed565a', color: '#181818', border: '1px solid #ed565a', fontWeight: 600 }}>
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function panelStyle(left: number | string, top: number | string, width: number | string, height: number | string): React.CSSProperties {
  return {
    position: 'fixed', left: left as any, top: top as any, width: width as any, height: height as any,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(1px)',
  };
}
