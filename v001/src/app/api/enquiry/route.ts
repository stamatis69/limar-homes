import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCatalog, resolveUnit } from "@/data/catalog";
import { deliver, DeliveryNotConfigured } from "@/lib/enquiry/deliver";
import { rateLimit } from "@/lib/enquiry/rate-limit";
import { validateEnquiry } from "@/lib/enquiry/validation";
import { isLocale } from "@/lib/i18n/routes";

export const dynamic = "force-dynamic";
const MAX_BODY = 16 * 1024;

function reference() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `LMR-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: NextRequest) {
  // CSRF / cross-site posting: only same-origin browser submissions are accepted.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { error: "forbidden" });
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return json(415, { error: "unsupported" });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const limited = rateLimit(ip);
  if (!limited.ok) return json(429, { error: "rate_limited" }, { "Retry-After": String(limited.retryAfter) });

  const text = await request.text();
  if (text.length > MAX_BODY) return json(413, { error: "too_large" });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json(400, { error: "rejected" });
  }

  const result = validateEnquiry(raw);
  if (!result.ok) return result.spam ? json(400, { error: "rejected" }) : json(422, { error: "validation", errors: result.errors });
  const e = result.value;

  // Resolve context against canonical data; the client never decides names or statuses.
  const catalog = getCatalog();
  const dev = e.context.developmentId ? catalog.developments.find((d) => d.id === e.context.developmentId) : undefined;
  if (e.context.developmentId && !dev) return json(422, { error: "validation", errors: { development: "invalid" } });
  const findUnit = (id: string) => catalog.inventory.units.find((u) => u.id === id);
  const unit = e.context.unitId ? findUnit(e.context.unitId) : undefined;
  if (e.context.unitId && (!unit || (dev && unit.developmentId !== dev.id))) return json(422, { error: "validation", errors: { unit: "invalid" } });
  const unitDev = unit ? catalog.developments.find((d) => d.id === unit.developmentId) : dev;
  const compared = e.context.comparedUnitIds
    .filter((id) => id !== e.context.unitId)
    .map(findUnit)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => resolveUnit(u, catalog.developments.find((d) => d.id === u.developmentId)!));

  const locale = isLocale(e.language) ? e.language : "en";
  const ref = reference();
  const payload = {
    reference: ref,
    receivedAt: new Date().toISOString(),
    inventorySource: catalog.inventory.source,
    language: e.language,
    sourcePage: e.context.sourcePage,
    source: e.context.source,
    campaignSource: e.context.campaign,
    developmentId: unitDev?.id ?? null,
    developmentName: unitDev?.name ?? null,
    unitId: unit?.id ?? null,
    unitLabel: unit?.label ?? null,
    unitStatus: unit?.status ?? null,
    comparedUnitIds: compared.map((u) => u.id),
    interestType: e.interest,
    goldenVisaInterest: e.goldenVisaInterest || e.interest === "golden-visa",
    pathfinderOutcome: e.context.pathfinder?.outcome ?? null,
    pathfinder: e.context.pathfinder,
    budgetBand: e.budget || null,
    preferredContactMethod: e.contactMethod,
    marketingConsent: e.marketingConsent,
    contact: { firstName: e.firstName, lastName: e.lastName, email: e.email, phone: e.phone || null, country: e.country },
    message: e.message || null,
  };

  try {
    const channel = await deliver(payload);
    // Log without personal data.
    console.info(`[enquiry] ${ref} delivered via ${channel} dev=${payload.developmentId ?? "-"} unit=${payload.unitId ?? "-"} interest=${e.interest}`);
  } catch (err) {
    if (err instanceof DeliveryNotConfigured) return json(503, { error: "unavailable" });
    console.error(`[enquiry] ${ref} delivery failed: ${err instanceof Error ? err.message : "unknown"}`);
    return json(502, { error: "server" });
  }

  return json(201, {
    ok: true,
    reference: ref,
    summary: {
      firstName: e.firstName,
      developmentName: unitDev?.name ?? null,
      developmentSlug: unitDev?.slug ?? null,
      location: unitDev ? `${unitDev.locality[locale]}, ${unitDev.city[locale]}` : null,
      unitId: unit?.id ?? null,
      unitLabel: unit?.label ?? null,
      unitStatus: unit?.status ?? null,
      compared: compared.map((u) => ({ id: u.id, label: u.label, developmentName: u.developmentName })),
      interest: e.interest,
      goldenVisaInterest: payload.goldenVisaInterest,
      contactMethod: e.contactMethod,
    },
  });
}
