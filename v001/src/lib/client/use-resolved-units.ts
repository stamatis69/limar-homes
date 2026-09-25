"use client";
import { useEffect, useState } from "react";
import type { ResolveResponse } from "@/lib/resolved";

export type Resolution = { state: "loading" | "ready" | "error"; data: ResolveResponse | null };
const EMPTY: Resolution = { state: "ready", data: { asOf: null, source: "canonical", units: [], missing: [] } };

/** Fetches current data for the given unit IDs; refetches when IDs change or the tab regains focus. */
export function useResolvedUnits(ids: string[]): Resolution {
  const key = ids.join(",");
  const [res, setRes] = useState<{ key: string; state: "ready" | "error"; data: ResolveResponse | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/units?ids=${encodeURIComponent(key)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: ResolveResponse) => !cancelled && setRes({ key, state: "ready", data }))
        .catch(() => !cancelled && setRes((r) => ({ key, state: "error", data: r?.data ?? null })));
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key]);

  if (!key) return EMPTY;
  if (!res) return { state: "loading", data: null };
  // While a new ID set loads, keep showing the previous data (stable tray) but mark loading.
  return res.key === key ? { state: res.state, data: res.data } : { state: "loading", data: res.data };
}
