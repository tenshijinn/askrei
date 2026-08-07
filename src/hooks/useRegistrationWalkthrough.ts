import { useCallback, useEffect, useState } from 'react';

const keyFor = (id?: string | null) =>
  id ? `rei_registration_walkthrough_completed:${id}` : null;

/**
 * Mini walkthrough scoped to the signup / registration screen.
 * Fires once per X user, only while they are signed into X but
 * have not yet completed registration.
 */
export function useRegistrationWalkthrough(
  userId?: string | null,
  enabled: boolean = true,
) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const k = keyFor(userId);
    if (!k) return undefined;
    if (typeof window === 'undefined') return undefined;
    try {
      if (!localStorage.getItem(k)) {
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
    return undefined;
  }, [userId, enabled]);

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
