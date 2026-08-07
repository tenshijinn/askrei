import { useCallback, useEffect, useState } from 'react';

const keyFor = (id?: string | null) =>
  id ? `rei_walkthrough_completed:${id}` : null;

export function useFirstTimeWalkthrough(userId?: string | null) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const k = keyFor(userId);
    if (!k) return undefined;
    if (typeof window === 'undefined') return undefined;
    try {
      if (!localStorage.getItem(k)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
    return undefined;
  }, [userId]);

  const markSeen = useCallback(() => {
    const k = keyFor(userId);
    if (k) {
      try { localStorage.setItem(k, 'true'); } catch {}
    }
    setOpen(false);
  }, [userId]);

  const replay = useCallback(() => {
    const k = keyFor(userId);
    if (k) {
      try { localStorage.removeItem(k); } catch {}
    }
    setOpen(true);
  }, [userId]);

  return { open, markSeen, replay };
}
