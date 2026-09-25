"use client";
import { useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

export type ConsentState = "unknown" | "granted" | "denied";
const KEY = "limar.consent.v1";
let state: ConsentState = "unknown";
let hydrated = false;
const listeners = new Set<() => void>();

function ensure() {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    const stored = readJSON<{ analytics: boolean }>("local", KEY);
    state = stored ? (stored.analytics ? "granted" : "denied") : "unknown";
  }
}

export const consentStore = {
  subscribe(l: () => void) {
    ensure();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get(): ConsentState {
    ensure();
    return state;
  },
  set(analytics: boolean) {
    state = analytics ? "granted" : "denied";
    writeJSON("local", KEY, { analytics, decidedAt: new Date().toISOString() });
    listeners.forEach((l) => l());
  },
  reset() {
    state = "unknown";
    writeJSON("local", KEY, null);
    listeners.forEach((l) => l());
  },
};

/** Server snapshot is "denied" so SSR never renders the banner (avoids layout shift for returning users). */
export function useConsent(): ConsentState {
  return useSyncExternalStore(consentStore.subscribe, consentStore.get, () => "denied" as ConsentState);
}
