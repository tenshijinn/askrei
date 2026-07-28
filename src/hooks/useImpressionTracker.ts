import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rei_impressions_seen";

function alreadySeen(code: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const set = new Set<string>(JSON.parse(raw));
    return set.has(code);
  } catch {
    return false;
  }
}

function markSeen(code: string) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(code)) arr.push(code);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

/**
 * Fires a bounty impression event once per session per short_code when the
 * element becomes >=50% visible for at least 500ms.
 */
export function useImpressionTracker(
  shortCode: string | null | undefined,
  options?: { guest?: boolean }
) {
  const ref = useRef<HTMLElement | null>(null);
  const guest = options?.guest === true;

  useEffect(() => {
    if (!shortCode) return;
    if (alreadySeen(shortCode)) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (timer) continue;
            timer = setTimeout(() => {
              if (alreadySeen(shortCode)) return;
              markSeen(shortCode);
              observer.disconnect();
              supabase.functions
                .invoke("track-campaign-impression", { body: { shortCode, guest } })
                .catch(() => {
                  /* ignore */
                });
            }, 500);
          } else if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [shortCode, guest]);

  return ref;
}
