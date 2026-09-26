"use client";
import { readJSON, writeJSON } from "./storage";

/**
 * First-touch campaign attribution (utm_*), recorded ONLY with analytics consent and kept for the
 * browser session only. Withdrawing consent deletes it. Never contains personal data.
 */
const KEY = "limar.campaign.v1";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function utmFromUrl(search: string): Record<string, string> | null {
  const p = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of UTM) {
    const v = p.get(k);
    if (v) out[k] = v.slice(0, 100);
  }
  return Object.keys(out).length ? out : null;
}

export function recordFirstTouch(consented: boolean) {
  if (!consented) {
    writeJSON("session", KEY, null);
    return;
  }
  if (readJSON("session", KEY)) return; // first touch wins
  const utm = utmFromUrl(window.location.search);
  if (utm) writeJSON("session", KEY, utm);
}

/** Campaign data for an enquiry: first touch if recorded, else the current URL — only with consent. */
export function campaignForEnquiry(consented: boolean): Record<string, string> | null {
  if (!consented) return null;
  return readJSON<Record<string, string>>("session", KEY) ?? utmFromUrl(window.location.search);
}
