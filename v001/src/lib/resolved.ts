import type { Amenity, Localized, Media, UnitStatus } from "@/lib/types";

/** A unit joined with its development — the shape served by /api/units to client surfaces. */
export interface ResolvedUnit {
  id: string;
  label: string;
  developmentId: string;
  developmentName: string;
  developmentSlug: string;
  locality: Localized;
  floor: number;
  bedrooms: number;
  bathrooms: number | null;
  area: number;
  outdoorArea: number | null;
  status: UnitStatus;
  price: number | null;
  orientation: Localized | null;
  parking: boolean | null;
  floorplan: Media | null;
  completionLabel: Localized;
  energyClassLabel: string;
  goldenVisaStatement: boolean;
  amenities: Amenity[];
}

export interface ResolveResponse {
  asOf: string | null;
  source: "canonical" | "fixture";
  units: ResolvedUnit[];
  missing: string[];
}
