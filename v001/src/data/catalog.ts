import "server-only";
import { developments } from "@/data/developments";
import { canonicalAvailability, canonicalInventory } from "@/data/inventory/canonical";
import { fixtureDevelopment, fixtureInventory } from "@/data/inventory/fixture";
import type { Development, Inventory, Unit } from "@/lib/types";
import type { ResolvedUnit, ResolveResponse } from "@/lib/resolved";

export type InventoryMode = "canonical" | "fixture";

export function inventoryMode(): InventoryMode {
  return process.env.LIMAR_INVENTORY === "fixture" ? "fixture" : "canonical";
}

export interface Catalog {
  mode: InventoryMode;
  developments: Development[];
  inventory: Inventory;
}

export function getCatalog(): Catalog {
  const mode = inventoryMode();
  if (mode === "fixture") {
    return { mode, developments: [...developments, fixtureDevelopment], inventory: fixtureInventory };
  }
  return { mode, developments, inventory: canonicalInventory };
}

export function getDevelopmentBySlug(slug: string): Development | undefined {
  return getCatalog().developments.find((d) => d.slug === slug);
}

export function unitsFor(developmentId: string): Unit[] {
  return getCatalog().inventory.units.filter((u) => u.developmentId === developmentId);
}

export function getUnit(unitId: string): Unit | undefined {
  return getCatalog().inventory.units.find((u) => u.id === unitId);
}

/**
 * Available-unit count. Returns null when residences are on sale but the unit schedule
 * has not been supplied (count unknown), 0 when sold out.
 */
export function availableCount(dev: Development): number | null {
  const units = unitsFor(dev.id);
  if (units.length > 0) return units.filter((u) => u.status === "available").length;
  if (dev.status === "sold-out") return 0;
  return canonicalAvailability[dev.id] ?? null;
}

/** Compact, serialisable summary passed to client components (Pathfinder, tray). */
export interface DevelopmentSummary {
  id: string;
  slug: string;
  name: string;
  status: Development["status"];
  region: Development["region"];
  locality: Development["locality"];
  sizeMin: number | null;
  sizeMax: number | null;
  bedroomsMin: number;
  bedroomsMax: number;
  completionLabel: Development["completion"]["label"];
  goldenVisaStatement: boolean;
  available: number | null;
  hasSchedule: boolean;
}

export function summaries(): DevelopmentSummary[] {
  return getCatalog().developments.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    status: d.status,
    region: d.region,
    locality: d.locality,
    sizeMin: d.sizeMin,
    sizeMax: d.sizeMax,
    bedroomsMin: d.bedroomsMin,
    bedroomsMax: d.bedroomsMax,
    completionLabel: d.completion.label,
    goldenVisaStatement: d.goldenVisa.limarStatement,
    available: availableCount(d),
    hasSchedule: unitsFor(d.id).length > 0,
  }));
}


export function resolveUnit(unit: Unit, dev: Development): ResolvedUnit {
  return {
    ...unit,
    developmentName: dev.name,
    developmentSlug: dev.slug,
    locality: dev.locality,
    completionLabel: dev.completion.label,
    energyClassLabel: dev.energyClassLabel,
    goldenVisaStatement: dev.goldenVisa.limarStatement,
    amenities: dev.amenities,
  };
}

export function resolveUnits(ids: string[]): ResolveResponse {
  const catalog = getCatalog();
  const units: ResolvedUnit[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const unit = catalog.inventory.units.find((u) => u.id === id);
    const dev = unit && catalog.developments.find((d) => d.id === unit.developmentId);
    if (unit && dev) units.push(resolveUnit(unit, dev));
    else missing.push(id);
  }
  return { asOf: catalog.inventory.asOf, source: catalog.inventory.source, units, missing };
}
