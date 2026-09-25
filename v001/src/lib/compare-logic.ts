import type { ResolvedUnit } from "@/lib/resolved";

export type DiffTag = "largest" | "extraBedroom" | "higherFloor" | "lowestPrice" | "onlyAvailable" | "hasOutdoor" | "hasParking";

export type CompareAttr =
  | "development"
  | "location"
  | "status"
  | "price"
  | "floor"
  | "area"
  | "outdoor"
  | "bedrooms"
  | "bathrooms"
  | "orientation"
  | "parking"
  | "completion"
  | "energy"
  | "floorplan"
  | "goldenVisa";

export interface Differences {
  tags: Record<string, DiffTag[]>;
  /** Attributes whose values are not identical across the compared units. */
  differing: Set<CompareAttr>;
  /** Price above the lowest listed price, per unit (only when ≥2 units have a listed price). */
  priceAboveLowest: Record<string, number>;
}

function uniqueMax<T>(units: ResolvedUnit[], get: (u: ResolvedUnit) => T | null, cmp: (a: T, b: T) => number): string[] {
  const vals = units.map((u) => ({ id: u.id, v: get(u) })).filter((x): x is { id: string; v: T } => x.v != null);
  if (vals.length < 2) return [];
  const best = vals.reduce((a, b) => (cmp(a.v, b.v) >= 0 ? a : b)).v;
  const winners = vals.filter((x) => cmp(x.v, best) === 0);
  return winners.length === vals.length ? [] : winners.map((w) => w.id);
}

/**
 * Factual differences only. No unit is labelled "best", "recommended" or "best value":
 * every tag states a measurable fact from canonical data and is shown with the value itself.
 */
export function computeDifferences(units: ResolvedUnit[]): Differences {
  const tags: Record<string, DiffTag[]> = Object.fromEntries(units.map((u) => [u.id, []]));
  const add = (ids: string[], tag: DiffTag) => ids.forEach((id) => tags[id]?.push(tag));

  add(uniqueMax(units, (u) => u.area, (a, b) => a - b), "largest");
  add(uniqueMax(units, (u) => u.bedrooms, (a, b) => a - b), "extraBedroom");
  add(uniqueMax(units, (u) => u.floor, (a, b) => a - b), "higherFloor");
  const priced = units.filter((u) => u.price != null && u.status !== "sold");
  add(uniqueMax(priced, (u) => u.price, (a, b) => b - a), "lowestPrice");
  const available = units.filter((u) => u.status === "available");
  if (units.length > 1 && available.length === 1) add([available[0]!.id], "onlyAvailable");
  const outdoor = units.filter((u) => (u.outdoorArea ?? 0) > 0);
  if (outdoor.length > 0 && outdoor.length < units.length) add(outdoor.map((u) => u.id), "hasOutdoor");
  const parking = units.filter((u) => u.parking === true);
  if (parking.length > 0 && parking.length < units.length) add(parking.map((u) => u.id), "hasParking");

  const differing = new Set<CompareAttr>();
  const check = (attr: CompareAttr, get: (u: ResolvedUnit) => unknown) => {
    const vals = new Set(units.map((u) => JSON.stringify(get(u) ?? null)));
    if (vals.size > 1) differing.add(attr);
  };
  check("development", (u) => u.developmentId);
  check("location", (u) => u.locality.en);
  check("status", (u) => u.status);
  check("price", (u) => u.price);
  check("floor", (u) => u.floor);
  check("area", (u) => u.area);
  check("outdoor", (u) => u.outdoorArea);
  check("bedrooms", (u) => u.bedrooms);
  check("bathrooms", (u) => u.bathrooms);
  check("orientation", (u) => u.orientation?.en);
  check("parking", (u) => u.parking);
  check("completion", (u) => u.completionLabel.en);
  check("energy", (u) => u.energyClassLabel);
  check("floorplan", (u) => Boolean(u.floorplan));
  check("goldenVisa", (u) => u.goldenVisaStatement);

  const priceAboveLowest: Record<string, number> = {};
  if (priced.length >= 2) {
    const min = Math.min(...priced.map((u) => u.price!));
    for (const u of priced) if (u.price! > min) priceAboveLowest[u.id] = u.price! - min;
  }
  return { tags, differing, priceAboveLowest };
}
