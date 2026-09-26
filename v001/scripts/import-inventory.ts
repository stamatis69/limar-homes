/**
 * npm run import:inventory -- <export.csv> [--dry-run] [--as-of=2026-10-01T09:00:00Z]
 *
 * Validates Limar's sales export and writes src/data/inventory/canonical-units.json.
 * Any error aborts without writing. See docs/INVENTORY_IMPORT.md.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { developments } from "../src/data/developments";
import { importInventory } from "../src/lib/inventory-import";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const asOfArg = args.find((a) => a.startsWith("--as-of="))?.split("=")[1];

if (!file) {
  console.error("Usage: npm run import:inventory -- <export.csv> [--dry-run] [--as-of=ISO-date]");
  process.exit(2);
}
const asOf = asOfArg ? new Date(asOfArg) : new Date();
if (Number.isNaN(asOf.getTime())) {
  console.error(`Invalid --as-of date: ${asOfArg}`);
  process.exit(2);
}

const result = importInventory(readFileSync(file, "utf8"), developments);

// Floorplan files must exist in public/ before they can be published.
for (const u of result.units) {
  if (u.floorplan && !existsSync(path.join(process.cwd(), "public", u.floorplan.src))) {
    result.errors.push({ row: 0, field: "floorplan", message: `${u.id}: file public${u.floorplan.src} not found.` });
  }
}

const fmt = (i: { row: number; field?: string; message: string }) => `  ${i.row ? `line ${i.row}` : "file"}${i.field ? ` [${i.field}]` : ""}: ${i.message}`;
if (result.warnings.length) console.log(`\nWARNINGS (${result.warnings.length})\n${result.warnings.map(fmt).join("\n")}`);
if (result.errors.length) {
  console.error(`\nERRORS (${result.errors.length}) — nothing was written\n${result.errors.map(fmt).join("\n")}`);
  process.exit(1);
}

console.log("\nSUMMARY");
for (const [dev, s] of Object.entries(result.summary)) console.log(`  ${dev}: ${s.total} units, ${s.available} available`);
if (dryRun) {
  console.log("\nDry run: canonical-units.json not modified.");
  process.exit(0);
}
const out = path.join(process.cwd(), "src/data/inventory/canonical-units.json");
writeFileSync(out, JSON.stringify({ asOf: asOf.toISOString(), importedFrom: path.basename(file), units: result.units }, null, 2) + "\n");
console.log(`\nWrote ${result.units.length} units to src/data/inventory/canonical-units.json (asOf ${asOf.toISOString()}).`);
console.log("Next: npm run verify:data && npm run build");
