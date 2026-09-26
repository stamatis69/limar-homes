"use client";
import { useSyncExternalStore } from "react";

/**
 * URL query state for statically generated pages. The server snapshot is "" (no filters), so the
 * static HTML is the unfiltered view and hydration never mismatches; URL filters apply after
 * hydration. Updates use the native History API (supported by the Next router).
 */
const EVENT = "limar:search";

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useUrlParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return new URLSearchParams(search);
}

/** Set (or clear with "all"/null) query params without navigation or scroll. */
export function setUrlParams(updates: Record<string, string | null>) {
  const next = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === "all") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  window.dispatchEvent(new Event(EVENT));
}
