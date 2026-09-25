"use client";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The browser's public pathname (e.g. /el/erga/terrace-heights), or null during SSR/hydration.
 * usePathname() on the server reports the internal rewritten path (/el/projects/...), so any UI
 * derived from the URL must render its neutral state first to avoid hydration mismatches.
 * Re-evaluated on every client navigation because usePathname() changes.
 */
export function usePublicPath(): string | null {
  usePathname();
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => null);
}
