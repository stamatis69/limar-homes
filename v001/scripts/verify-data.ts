/**
 * Canonical data + launch-readiness check.
 *   npm run verify:data        → integrity report (fails on broken data)
 *   npm run verify:production  → also fails on launch blockers (fixture data, no enquiry delivery target)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { developments } from "../src/data/developments";
import { canonicalInventory } from "../src/data/inventory/canonical";

const production = process.argv.includes("--production");

/** Local media must exist under public/ and must never be a remote hotlink. */
function checkMedia(owner: string, src: string | undefined | null, errs: string[]) {
  if (!src) return;
  if (/^https?:\/\//i.test(src)) return errs.push(`${owner}: ${src} is remote — download it into public/media and record its licence in ASSET_SOURCES.md`);
  if (!src.startsWith("/")) return errs.push(`${owner}: ${src} must be an absolute public path (e.g. /media/…)`);
  if (!existsSync(join(process.cwd(), "public", src))) errs.push(`${owner}: ${src} does not exist in public/`);
}
const errors: string[] = [];
const blockers: string[] = [];
const warnings: string[] = [];

const ids = new Set<string>();
for (const d of developments) {
  if (ids.has(d.id)) errors.push(`duplicate development id ${d.id}`);
  ids.add(d.id);
  if (d.coordinates) warnings.push(`${d.id}: coordinates present — confirm they are surveyed, not geocoded guesses`);
  if (d.sizeMin != null && d.sizeMax != null && d.sizeMin > d.sizeMax) errors.push(`${d.id}: sizeMin > sizeMax`);
  if (d.bedroomsMin > d.bedroomsMax) errors.push(`${d.id}: bedroomsMin > bedroomsMax`);
  for (const l of ["en", "el", "tr"] as const) {
    for (const [k, v] of Object.entries(d.copy)) if (!v[l]?.trim()) errors.push(`${d.id}: copy.${k}.${l} missing`);
  }
  if (d.unverified.length) warnings.push(`${d.id}: unverified fields → ${d.unverified.join(", ")}`);
  if (d.goldenVisa.limarStatement && d.goldenVisa.route === "unconfirmed") warnings.push(`${d.id}: Golden Visa route per residence not confirmed by counsel`);
  checkMedia(`${d.id} hero`, d.media.hero?.src, errors);
  d.media.gallery.forEach((m, i) => checkMedia(`${d.id} gallery[${i}]`, m.src, errors));
  checkMedia(`${d.id} brochure`, d.brochure?.href, errors);
  for (const m of [d.media.hero, ...d.media.gallery]) {
    if (m && (!m.alt.en.trim() || !m.alt.el.trim() || !m.alt.tr.trim())) errors.push(`${d.id}: ${m.src} is missing alt text in en/el/tr`);
  }
}

const unitIds = new Set<string>();
for (const u of canonicalInventory.units) {
  if (unitIds.has(u.id)) errors.push(`duplicate unit id ${u.id}`);
  unitIds.add(u.id);
  if (!ids.has(u.developmentId)) errors.push(`${u.id}: unknown development ${u.developmentId}`);
  const dev = developments.find((d) => d.id === u.developmentId);
  if (dev?.status === "sold-out" && u.status !== "sold") errors.push(`${u.id}: development sold out but unit is ${u.status}`);
  if (u.area <= 0) errors.push(`${u.id}: invalid area`);
  checkMedia(`${u.id} floorplan`, u.floorplan?.src, errors);
}
if (canonicalInventory.units.length && !canonicalInventory.asOf) errors.push("canonical inventory has units but no asOf timestamp");
for (const d of developments.filter((x) => x.status === "selling")) {
  if (!canonicalInventory.units.some((u) => u.developmentId === d.id)) warnings.push(`${d.id}: selling but no unit schedule loaded (site shows "schedule on request")`);
}

if (production) {
  if (process.env.LIMAR_INVENTORY === "fixture") blockers.push("LIMAR_INVENTORY=fixture — demonstration data cannot ship");
  if (!process.env.ENQUIRY_WEBHOOK_URL) blockers.push("ENQUIRY_WEBHOOK_URL not set — enquiries would return 503");
  if (!process.env.ENQUIRY_WEBHOOK_SECRET) warnings.push("ENQUIRY_WEBHOOK_SECRET not set — webhook payloads unsigned");
  if (!/^MQ-\d{4}-\d{4}$/.test(process.env.MERQON_SITE_ID ?? "")) warnings.push("MERQON_SITE_ID not allocated — provenance layer disabled in production");
  warnings.push("Golden Visa copy (en/el/tr) requires counsel review against official sources before launch");
  warnings.push("Legacy URL crawl pending — see SEO_ROUTE_MAP.md launch checklist");
}

const out = (label: string, list: string[]) => list.length && console.log(`\n${label} (${list.length})\n` + list.map((x) => `  - ${x}`).join("\n"));
console.log(`Developments: ${developments.length} · canonical units: ${canonicalInventory.units.length}`);
out("ERRORS", errors);
out("LAUNCH BLOCKERS", blockers);
out("WARNINGS", warnings);
if (errors.length || blockers.length) process.exit(1);
console.log("\nOK");
