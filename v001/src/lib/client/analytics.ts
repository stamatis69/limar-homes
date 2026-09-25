"use client";
import { consentStore } from "./consent-store";

/**
 * Privacy-aware product analytics.
 * - Nothing is recorded without explicit consent.
 * - Only whitelisted, non-personal properties are forwarded (never names, email, phone, message).
 * - Events go to window.dataLayer (provider-agnostic). No third-party script is loaded by
 *   this codebase; connecting a provider is a deployment decision recorded in PROJECT_STATE.md.
 */
export type AnalyticsEvent =
  | "development_view"
  | "unit_view"
  | "floorplan_view"
  | "compare_add"
  | "compare_remove"
  | "comparison_open"
  | "golden_visa_pathfinder_start"
  | "golden_visa_pathfinder_step"
  | "golden_visa_pathfinder_complete"
  | "golden_visa_result"
  | "enquiry_start"
  | "enquiry_validation_error"
  | "enquiry_submit"
  | "enquiry_success";

const ALLOWED = new Set(["developmentId", "unitId", "unitStatus", "step", "outcome", "route", "count", "locale", "source", "interest", "field", "floor"]);

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: AnalyticsEvent, props: Record<string, string | number | boolean | null | undefined> = {}) {
  if (typeof window === "undefined") return;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) if (ALLOWED.has(k) && v !== undefined) clean[k] = v;
  window.dispatchEvent(new CustomEvent("limar:analytics", { detail: { event, ...clean, consented: consentStore.get() === "granted" } }));
  if (consentStore.get() !== "granted") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...clean });
}
