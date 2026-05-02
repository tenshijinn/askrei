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
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_PREFIX = "rei_task_preview_";
const inFlight = new Map<string, Promise<TaskPreview | null>>();

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

async function fetchTask(id: string): Promise<TaskPreview | null> {
  if (inFlight.has(id)) return inFlight.get(id)!;
  const promise = (async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, company_name, compensation, og_image, link, opportunity_type")
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

export function useTaskPreview(taskId: string | null) {
  const [data, setData] = useState<TaskPreview | null>(() =>
    taskId && UUID_RE.test(taskId) ? readCache(taskId) : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId || !UUID_RE.test(taskId)) return;
    const cached = readCache(taskId);
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
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

  return { data, loading };
}
