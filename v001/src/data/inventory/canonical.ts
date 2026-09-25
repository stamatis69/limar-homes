import type { Inventory } from "@/lib/types";

/**
 * CANONICAL UNIT INVENTORY.
 *
 * Empty on purpose: Limar's live unit schedule (Terrace Heights) could not be retrieved
 * from the build environment and must not be invented. Populate this from the Limar
 * sales system export (see scripts/import-inventory.md). Every surface — explorer,
 * comparison, Pathfinder matches, enquiry validation, structured data — reads from here.
 *
 * Shape per unit: see `Unit` in src/lib/types.ts. `price` stays null unless Limar
 * publishes a current list price.
 */
export const canonicalInventory: Inventory = {
  source: "canonical",
  asOf: null,
  units: [],
};

/**
 * Availability known at development level while the unit schedule is pending.
 * `null` = residences are available but the count is not confirmed.
 */
export const canonicalAvailability: Record<string, number | null> = {
  "terrace-heights": null,
  "parkview-residences": 0,
  "portside-residences": 0,
  "aura-residences": 0,
  "la-riviera": 0,
};
