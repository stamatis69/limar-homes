/**
 * Enquiry validation — shared by the browser (fast feedback) and the server (authoritative).
 * No personal data leaves this module except through the validated object.
 */
import { COUNTRY_CODES } from "@/lib/format";

export const INTERESTS = ["purchase", "golden-visa", "investment", "brochure", "general"] as const;
export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export const LANGUAGES = ["en", "el", "tr"] as const;
export const BUDGETS = ["under-250", "250-400", "400-800", "800-plus"] as const;
export const PF_OUTCOMES = ["potential", "specialist", "inventory-mismatch", "more-info", "outside-scope", "property-only"] as const;
export const PF_ROUTES = ["800k", "400k", "250k", "none", "unknown"] as const;
export const PF_LOCATIONS = ["attica", "outside", "open"] as const;
export const PF_PROPERTY = ["compact", "family", "open"] as const;

export type Interest = (typeof INTERESTS)[number];
export type ContactMethod = (typeof CONTACT_METHODS)[number];
export type ErrorCode = "required" | "email" | "phone" | "phoneRequired" | "tooLong" | "invalid";

export const FIELDS = ["interest", "firstName", "lastName", "email", "contactMethod", "phone", "country", "language", "budget", "message"] as const;
export type Field = (typeof FIELDS)[number] | "development" | "unit";

export interface EnquiryInput {
  interest: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  contactMethod: string;
  budget: string;
  goldenVisaInterest: boolean;
  message: string;
  marketingConsent: boolean;
  context: {
    developmentId: string | null;
    unitId: string | null;
    comparedUnitIds: string[];
    sourcePage: string;
    source: string;
    campaign: Record<string, string> | null;
    pathfinder: null | { outcome: string; route: string; budget: string; location: string; property: string };
  };
  /** Honeypot — must be empty. */
  website: string;
  startedAt: number;
}

export interface ValidEnquiry extends EnquiryInput {
  interest: Interest;
  contactMethod: ContactMethod;
  language: (typeof LANGUAGES)[number];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9\s().-]{7,24}$/;
const ID = /^[\w.:-]{1,80}$/;

const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max + 1) : "");
const oneOf = <T extends readonly string[]>(list: T, v: string): v is T[number] => (list as readonly string[]).includes(v);

export function validateField(field: (typeof FIELDS)[number], input: Pick<EnquiryInput, "contactMethod"> & Record<string, unknown>): ErrorCode | null {
  const v = str(input[field]);
  switch (field) {
    case "firstName":
    case "lastName":
      if (!v) return "required";
      return v.length > 80 ? "tooLong" : null;
    case "email":
      if (!v) return "required";
      if (v.length > 254) return "tooLong";
      return EMAIL.test(v) ? null : "email";
    case "phone": {
      const needs = input.contactMethod === "phone" || input.contactMethod === "whatsapp";
      if (!v) return needs ? "phoneRequired" : null;
      const digits = v.replace(/\D/g, "").length;
      return PHONE.test(v) && digits >= 7 && digits <= 15 ? null : "phone";
    }
    case "country":
      if (!v) return "required";
      return COUNTRY_CODES.includes(v) ? null : "invalid";
    case "language":
      return oneOf(LANGUAGES, v) ? null : "invalid";
    case "contactMethod":
      return oneOf(CONTACT_METHODS, v) ? null : "required";
    case "interest":
      return oneOf(INTERESTS, v) ? null : "required";
    case "budget":
      return !v || oneOf(BUDGETS, v) ? null : "invalid";
    case "message":
      return v.length > 2000 ? "tooLong" : null;
  }
}

export type ValidationResult = { ok: true; value: ValidEnquiry } | { ok: false; errors: Partial<Record<Field, ErrorCode>>; spam?: boolean };

/** Full validation of an untrusted payload. The server calls this; the client calls it before sending. */
export function validateEnquiry(raw: unknown, now = Date.now()): ValidationResult {
  if (!raw || typeof raw !== "object") return { ok: false, errors: {}, spam: true };
  const r = raw as Record<string, unknown>;
  const ctx = (r.context && typeof r.context === "object" ? r.context : {}) as Record<string, unknown>;
  const input: EnquiryInput = {
    interest: str(r.interest, 40),
    firstName: str(r.firstName, 80),
    lastName: str(r.lastName, 80),
    email: str(r.email, 254),
    phone: str(r.phone, 30),
    country: str(r.country, 2).toUpperCase(),
    language: str(r.language, 2),
    contactMethod: str(r.contactMethod, 20),
    budget: str(r.budget, 20),
    goldenVisaInterest: r.goldenVisaInterest === true,
    message: str(r.message, 2000),
    marketingConsent: r.marketingConsent === true,
    website: str(r.website, 200),
    startedAt: typeof r.startedAt === "number" ? r.startedAt : 0,
    context: {
      developmentId: ctx.developmentId == null || ctx.developmentId === "" ? null : str(ctx.developmentId, 80),
      unitId: ctx.unitId == null || ctx.unitId === "" ? null : str(ctx.unitId, 80),
      comparedUnitIds: Array.isArray(ctx.comparedUnitIds) ? ctx.comparedUnitIds.slice(0, 3).map((x) => str(x, 80)).filter(Boolean) : [],
      sourcePage: str(ctx.sourcePage, 200),
      source: str(ctx.source, 40),
      campaign: sanitizeCampaign(ctx.campaign),
      pathfinder: sanitizePathfinder(ctx.pathfinder),
    },
  };

  // Spam signals: honeypot filled, or submitted implausibly fast / with a stale or future timestamp.
  const age = now - input.startedAt;
  if (input.website !== "" || !(age > 2500 && age < 24 * 3600 * 1000)) return { ok: false, errors: {}, spam: true };

  const errors: Partial<Record<Field, ErrorCode>> = {};
  for (const f of FIELDS) {
    const e = validateField(f, input as unknown as Record<string, unknown> & { contactMethod: string });
    if (e) errors[f] = e;
  }
  if (input.context.developmentId && !ID.test(input.context.developmentId)) errors.development = "invalid";
  if (input.context.unitId && !ID.test(input.context.unitId)) errors.unit = "invalid";
  if (input.context.comparedUnitIds.some((id) => !ID.test(id))) errors.unit = "invalid";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: input as ValidEnquiry };
}

function sanitizePathfinder(v: unknown): EnquiryInput["context"]["pathfinder"] {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  const outcome = str(p.outcome, 40);
  const route = str(p.route, 20);
  if (!oneOf(PF_OUTCOMES, outcome) || !oneOf(PF_ROUTES, route)) return null;
  const budget = str(p.budget, 20);
  const location = str(p.location, 20);
  const property = str(p.property, 20);
  return {
    outcome,
    route,
    budget: oneOf(BUDGETS, budget) || budget === "undisclosed" ? budget : "",
    location: oneOf(PF_LOCATIONS, location) ? location : "",
    property: oneOf(PF_PROPERTY, property) ? property : "",
  };
}

/** Only standard UTM keys, short values. The client sends these only with analytics consent. */
function sanitizeCampaign(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== "object") return null;
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const val = str((v as Record<string, unknown>)[k], 100);
    if (val && /^[\w .:/-]+$/.test(val)) out[k] = val;
  }
  return Object.keys(out).length ? out : null;
}
