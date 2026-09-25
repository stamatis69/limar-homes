import type { Locale } from "@/lib/i18n/routes";

export type Localized = Record<Locale, string>;

export type DevelopmentStatus = "selling" | "sold-out";
export type UnitStatus = "available" | "under-offer" | "reserved" | "sold";
export type Region = "attica" | "corinthia";

export type Amenity =
  | "rooftop"
  | "fitness"
  | "elevator"
  | "heating"
  | "split-ac"
  | "parking"
  | "garden"
  | "pool"
  | "jacuzzi"
  | "sea-view"
  | "furniture-pack"
  | "acropolis-view";

export interface Media {
  src: string;
  alt: Localized;
  width: number;
  height: number;
  kind: "exterior" | "interior" | "detail" | "floorplan" | "neighbourhood";
}

/** Parameters for the generated schematic elevation. Derived from verified facts only. */
export interface DrawingSpec {
  floors: number;
  bays: number;
  roof: "terrace" | "flat";
  ground: "pilotis" | "retail" | "garden";
  features: Array<"pool" | "sea" | "garden" | "pergola">;
  /** True when floor count/bays are not confirmed; the drawing is labelled "illustrative". */
  illustrative: boolean;
}

export interface Development {
  id: string;
  slug: string;
  name: string;
  status: DevelopmentStatus;
  region: Region;
  locality: Localized;
  city: Localized;
  address: { street: string; postalCode: string | null; locality: string };
  /** Never fabricated. Null until Limar supplies surveyed coordinates. */
  coordinates: null | { lat: number; lng: number };
  completion: { year: number | null; label: Localized };
  unitsTotal: number | null;
  unitsTotalLabel: Localized;
  sizeMin: number | null;
  sizeMax: number | null;
  bedroomsMin: number;
  bedroomsMax: number;
  energyClass: string | null;
  energyClassLabel: string;
  floors: number | null;
  amenities: Amenity[];
  /** Features announced in press but not confirmed by a technical specification. */
  announcedFeatures?: Localized;
  goldenVisa: {
    /** Limar markets this development as Golden Visa-eligible. */
    limarStatement: boolean;
    /** Qualifying route is NOT confirmed per unit until legal counsel verifies. */
    route: "unconfirmed" | "250k-conversion" | "400k" | "800k";
  };
  media: { hero: Media | null; gallery: Media[] };
  brochure: { href: string } | null;
  drawing: DrawingSpec;
  copy: {
    tagline: Localized;
    intro: Localized;
    architecture: Localized;
    location: Localized;
    investment: Localized;
  };
  /** Field names whose value is not yet confirmed by an authoritative Limar source. */
  unverified: string[];
  /** Development number in the drawing set (sheet ordering). */
  sheet: string;
}

export interface Unit {
  id: string;
  developmentId: string;
  label: string;
  floor: number;
  bedrooms: number;
  bathrooms: number | null;
  area: number;
  outdoorArea: number | null;
  status: UnitStatus;
  /** EUR. Null = price on request. Never populated from historical sources. */
  price: number | null;
  orientation: Localized | null;
  parking: boolean | null;
  floorplan: Media | null;
}

export interface Inventory {
  source: "canonical" | "fixture";
  /** ISO timestamp when this inventory snapshot was produced. */
  asOf: string | null;
  units: Unit[];
}
