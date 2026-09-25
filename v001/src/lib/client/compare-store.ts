"use client";
import { useSyncExternalStore } from "react";
import type { UnitStatus } from "@/lib/types";
import { readJSON, writeJSON } from "./storage";

/**
 * Comparison selection. Persists unit IDs only (plus the status observed when added, used
 * solely to tell the buyer that status changed). All displayed data is re-resolved from
 * /api/units on every load, so availability and prices are never served stale.
 * Stored in localStorage so a shortlist survives navigation, refresh and a return visit;
 * contains no personal data. Expires after 30 days.
 */
export const COMPARE_MAX = 4;
const KEY = "limar.compare.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface CompareState {
  ids: string[];
  primary: string | null;
  seenStatus: Record<string, UnitStatus>;
}

const EMPTY: CompareState = { ids: [], primary: null, seenStatus: {} };
let state: CompareState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): CompareState {
  const stored = readJSON<CompareState & { savedAt: number }>("local", KEY);
  if (!stored || !Array.isArray(stored.ids) || Date.now() - (stored.savedAt ?? 0) > TTL_MS) return EMPTY;
  const ids = stored.ids.filter((id) => typeof id === "string").slice(0, COMPARE_MAX);
  return { ids, primary: stored.primary && ids.includes(stored.primary) ? stored.primary : ids[0] ?? null, seenStatus: stored.seenStatus ?? {} };
}

function ensure() {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    state = load();
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        state = load();
        listeners.forEach((l) => l());
      }
    });
  }
}

function commit(next: CompareState) {
  state = next;
  writeJSON("local", KEY, next.ids.length ? { ...next, savedAt: Date.now() } : null);
  listeners.forEach((l) => l());
}

export const compareStore = {
  subscribe(listener: () => void) {
    ensure();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get(): CompareState {
    ensure();
    return state;
  },
  has(id: string) {
    return compareStore.get().ids.includes(id);
  },
  /** Returns false when the limit is reached. */
  add(id: string, status: UnitStatus): boolean {
    const s = compareStore.get();
    if (s.ids.includes(id)) return true;
    if (s.ids.length >= COMPARE_MAX) return false;
    commit({ ids: [...s.ids, id], primary: s.primary ?? id, seenStatus: { ...s.seenStatus, [id]: status } });
    return true;
  },
  remove(id: string) {
    const s = compareStore.get();
    const ids = s.ids.filter((x) => x !== id);
    const seenStatus = { ...s.seenStatus };
    delete seenStatus[id];
    commit({ ids, primary: s.primary === id ? ids[0] ?? null : s.primary, seenStatus });
  },
  setPrimary(id: string) {
    const s = compareStore.get();
    if (s.ids.includes(id)) commit({ ...s, primary: id });
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCompare(): CompareState {
  return useSyncExternalStore(compareStore.subscribe, compareStore.get, () => EMPTY);
}
