import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TaskPreview {
  id: string;
  title: string;
  company_name: string | null;
  compensation: string | null;
  og_image: string | null;
  link: string;
  opportunity_type: string | null;
  tracking_short_code: string | null;
}


const TTL_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_PREFIX = "rei_task_preview_";
const VISITS_PREFIX = "rei_task_visits_";
const VISITS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const inFlight = new Map<string, Promise<TaskPreview | null>>();
const visitsInFlight = new Map<string, Promise<number | null>>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readCache(id: string): TaskPreview | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: TaskPreview; fetchedAt: number };
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(id: string, data: TaskPreview) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + id,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch {
    /* quota — ignore */
  }
}

function readVisitsCache(code: string): number | null {
  try {
    const raw = localStorage.getItem(VISITS_PREFIX + code);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { count: number; fetchedAt: number };
    if (Date.now() - parsed.fetchedAt > VISITS_TTL_MS) return null;
    return parsed.count;
  } catch {
    return null;
  }
}

function writeVisitsCache(code: string, count: number) {
  try {
    localStorage.setItem(
      VISITS_PREFIX + code,
      JSON.stringify({ count, fetchedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

async function fetchTask(id: string): Promise<TaskPreview | null> {
  if (inFlight.has(id)) return inFlight.get(id)!;
  const promise = (async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, company_name, compensation, og_image, link, opportunity_type, tracking_short_code")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    writeCache(id, data as TaskPreview);
    return data as TaskPreview;
  })();
  inFlight.set(id, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(id);
  }
}

async function fetchUniqueVisits(shortCode: string): Promise<number | null> {
  if (visitsInFlight.has(shortCode)) return visitsInFlight.get(shortCode)!;
  const promise = (async () => {
    try {
      const { data: sub, error: subErr } = await supabase
        .from("v_public_campaign_subscriptions")
        .select("id")
        .eq("short_code", shortCode)
        .maybeSingle();
      if (subErr || !sub) return null;
      const { data: unique, error: clickErr } = await supabase
        .rpc("get_campaign_unique_visits", { p_short_code: shortCode });
      if (clickErr) return null;
      const uniqueCount = typeof unique === "number" ? unique : 0;
      writeVisitsCache(shortCode, uniqueCount);
      return uniqueCount;
    } catch {
      return null;
    }
  })();
  visitsInFlight.set(shortCode, promise);
  try {
    return await promise;
  } finally {
    visitsInFlight.delete(shortCode);
  }
}

export function useTaskPreview(taskId: string | null) {
  const [data, setData] = useState<TaskPreview | null>(() =>
    taskId && UUID_RE.test(taskId) ? readCache(taskId) : null
  );
  const [loading, setLoading] = useState(false);
  const [uniqueVisits, setUniqueVisits] = useState<number | null>(null);

  useEffect(() => {
    if (!taskId || !UUID_RE.test(taskId)) return;
    const cached = readCache(taskId);
    if (cached) {
      setData(cached);
    }
    let cancelled = false;
    if (!cached) setLoading(true);
    fetchTask(taskId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    const code = data?.tracking_short_code;
    if (!code) {
      setUniqueVisits(null);
      return;
    }
    const cached = readVisitsCache(code);
    if (cached !== null) setUniqueVisits(cached);
    let cancelled = false;
    fetchUniqueVisits(code).then((n) => {
      if (!cancelled && n !== null) setUniqueVisits(n);
    });
    return () => {
      cancelled = true;
    };
  }, [data?.tracking_short_code]);

  return { data, loading, uniqueVisits };
}
