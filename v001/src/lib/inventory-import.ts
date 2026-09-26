/**
 * Inventory import — converts Limar's sales-system export (CSV) into canonical units.
 *
 * Strict by design: any invalid row blocks the whole import (a half-imported availability list is
 * worse than none). Warnings are reported but do not block. Pure module: no filesystem access,
 * so it is unit-tested directly; the CLI lives in scripts/import-inventory.ts.
 */
import type { Development, Localized, Unit, UnitStatus } from "@/lib/types";

export interface ImportIssue {
  row: number; // 1-based line number in the CSV (header = 1)
  field?: string;
  message: string;
}

export interface ImportResult {
  units: Unit[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  summary: Record<string, { total: number; available: number }>;
}

/** Accepted header names (lower-cased, trimmed) → field. Greek headers included for Limar's sales team. */
const HEADERS: Record<string, keyof RawRow> = {
  development: "development", development_id: "development", project: "development", "έργο": "development",
  unit: "unit", unit_id: "unit", label: "unit", "κατοικία": "unit", "μονάδα": "unit",
  floor: "floor", "όροφος": "floor",
  bedrooms: "bedrooms", beds: "bedrooms", "υπνοδωμάτια": "bedrooms",
  bathrooms: "bathrooms", baths: "bathrooms", "μπάνια": "bathrooms",
  area: "area", area_m2: "area", interior_m2: "area", "εμβαδόν": "area",
  outdoor: "outdoor", outdoor_m2: "outdoor", balcony_m2: "outdoor", "εξωτερικό": "outdoor",
  status: "status", "κατάσταση": "status",
  price: "price", price_eur: "price", "τιμή": "price",
  orientation: "orientation", "προσανατολισμός": "orientation",
  parking: "parking", "στάθμευση": "parking",
  floorplan: "floorplan", plan: "floorplan", "κάτοψη": "floorplan",
};

interface RawRow {
  development: string;
  unit: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  outdoor: string;
  status: string;
  price: string;
  orientation: string;
  parking: string;
  floorplan: string;
}

const REQUIRED: Array<keyof RawRow> = ["development", "unit", "floor", "bedrooms", "area", "status"];

const STATUS: Record<string, UnitStatus> = {
  available: "available", "for sale": "available", "διαθέσιμο": "available", "διαθέσιμη": "available", "müsait": "available",
  "under offer": "under-offer", "under-offer": "under-offer", offer: "under-offer", "υπό διαπραγμάτευση": "under-offer", "προσφορά": "under-offer",
  reserved: "reserved", "κρατημένο": "reserved", "δεσμευμένο": "reserved", "δεσμευμένη": "reserved", "rezerve": "reserved",
  sold: "sold", "πωλήθηκε": "sold", "πουλημένο": "sold", "satıldı": "sold",
};

const YES = new Set(["yes", "y", "true", "1", "ναι", "evet"]);
const NO = new Set(["no", "n", "false", "0", "όχι", "οχι", "hayır"]);

const ORIENTATION: Record<string, Localized> = {
  n: { en: "North", el: "Βόρειος", tr: "Kuzey" },
  s: { en: "South", el: "Νότιος", tr: "Güney" },
  e: { en: "East", el: "Ανατολικός", tr: "Doğu" },
  w: { en: "West", el: "Δυτικός", tr: "Batı" },
  ne: { en: "North-east", el: "Βορειοανατολικός", tr: "Kuzeydoğu" },
  nw: { en: "North-west", el: "Βορειοδυτικός", tr: "Kuzeybatı" },
  se: { en: "South-east", el: "Νοτιοανατολικός", tr: "Güneydoğu" },
  sw: { en: "South-west", el: "Νοτιοδυτικός", tr: "Güneybatı" },
};
const ORIENTATION_WORDS: Record<string, string> = {
  north: "n", south: "s", east: "e", west: "w",
  "north-east": "ne", northeast: "ne", "north east": "ne", "north-west": "nw", northwest: "nw", "north west": "nw",
  "south-east": "se", southeast: "se", "south east": "se", "south-west": "sw", southwest: "sw", "south west": "sw",
  "β": "n", "ν": "s", "α": "e", "δ": "w", "βα": "ne", "βδ": "nw", "να": "se", "νδ": "sw",
};

/** Minimal RFC-4180 CSV parser: quotes, escaped quotes, CRLF, BOM; ',' or ';' delimiter (Greek Excel uses ';'). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** "56,4" / "56.4" / "1.234,5" / "€ 185.000" / "185,000" → number. Returns NaN when not numeric. */
export function parseNumber(raw: string): number {
  let s = raw.replace(/[€\s m²]/gi, "").replace(/eur$/i, "");
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // the later separator is the decimal one
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // "56,4" decimal vs "185,000" thousands: three digits after a single comma → thousands
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "185.000" (Greek thousands)
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

function norm(v: string) {
  return v.trim().toLowerCase().normalize("NFC");
}

export function importInventory(csv: string, developments: Development[]): ImportResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const rows = parseCsv(csv);
  // skip blank lines and "#" comment lines, remembering real line numbers
  const lines = rows.map((cells, i) => ({ cells, line: i + 1 })).filter(({ cells }) => cells.some((c) => c.trim()) && !cells[0]?.trim().startsWith("#"));
  if (!lines.length) return { units: [], errors: [{ row: 1, message: "File is empty." }], warnings, summary: {} };

  const header = lines[0]!;
  const map: Array<keyof RawRow | null> = header.cells.map((h) => HEADERS[norm(h).replace(/\s+/g, " ")] ?? HEADERS[norm(h).replace(/[\s-]+/g, "_")] ?? null);
  header.cells.forEach((h, i) => {
    if (!map[i] && h.trim()) warnings.push({ row: header.line, field: h, message: `Unknown column "${h}" ignored.` });
  });
  for (const req of REQUIRED) if (!map.includes(req)) errors.push({ row: header.line, field: req, message: `Required column "${req}" is missing.` });
  if (errors.length) return { units: [], errors, warnings, summary: {} };

  const byKey = new Map<string, Development>();
  for (const d of developments) {
    byKey.set(norm(d.id), d);
    byKey.set(norm(d.slug), d);
    byKey.set(norm(d.name), d);
  }

  if (lines.length < 2) errors.push({ row: header.line, message: "No unit rows found — refusing to replace the schedule with an empty one." });
  const units: Unit[] = [];
  const seen = new Set<string>();
  for (const { cells, line } of lines.slice(1)) {
    const raw = {} as RawRow;
    map.forEach((field, i) => {
      if (field) raw[field] = (cells[i] ?? "").trim();
    });
    const err = (field: string, message: string) => errors.push({ row: line, field, message });
    const warn = (field: string, message: string) => warnings.push({ row: line, field, message });
    for (const req of REQUIRED) if (!raw[req]) err(req, "Required value is empty.");
    if (REQUIRED.some((r) => !raw[r])) continue;

    const dev = byKey.get(norm(raw.development));
    if (!dev) {
      err("development", `Unknown development "${raw.development}". Use one of: ${developments.map((d) => d.id).join(", ")}.`);
      continue;
    }
    if (!/^[\w.-]{1,20}$/.test(raw.unit)) err("unit", `Unit label "${raw.unit}" must be 1–20 letters, digits, "." or "-".`);
    const id = `${dev.id}:${raw.unit}`;
    if (seen.has(id)) err("unit", `Duplicate unit ${raw.unit} in ${dev.name}.`);
    seen.add(id);

    const floorRaw = norm(raw.floor);
    const floor = ["g", "gf", "ground", "ισόγειο", "ισογειο", "zemin"].includes(floorRaw) ? 0 : parseNumber(raw.floor);
    if (!Number.isInteger(floor) || floor < -2 || floor > 40) err("floor", `Floor "${raw.floor}" is not a whole number (use 0 for ground).`);
    else if (dev.floors != null && floor > dev.floors) warn("floor", `Floor ${floor} is above the development's ${dev.floors} floors.`);

    const bedrooms = parseNumber(raw.bedrooms);
    if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 8) err("bedrooms", `Bedrooms "${raw.bedrooms}" must be a whole number 0–8.`);
    else if (bedrooms < dev.bedroomsMin || bedrooms > dev.bedroomsMax) warn("bedrooms", `${bedrooms} bedrooms is outside ${dev.name}'s published ${dev.bedroomsMin}–${dev.bedroomsMax}.`);

    const bathrooms = raw.bathrooms ? parseNumber(raw.bathrooms) : null;
    if (bathrooms != null && (!Number.isInteger(bathrooms) || bathrooms < 0 || bathrooms > 8)) err("bathrooms", `Bathrooms "${raw.bathrooms}" must be a whole number.`);

    const area = parseNumber(raw.area);
    if (!(area > 5 && area < 2000)) err("area", `Area "${raw.area}" is not a plausible m² value.`);
    else if ((dev.sizeMin != null && area < dev.sizeMin * 0.9) || (dev.sizeMax != null && area > dev.sizeMax * 1.1))
      warn("area", `${area} m² is outside ${dev.name}'s published range; update the development record if the export is right.`);

    const outdoor = raw.outdoor ? parseNumber(raw.outdoor) : null;
    if (outdoor != null && !(outdoor >= 0 && outdoor < 2000)) err("outdoor", `Outdoor area "${raw.outdoor}" is not valid.`);

    const status = STATUS[norm(raw.status)];
    if (!status) err("status", `Status "${raw.status}" not recognised (available / under offer / reserved / sold).`);
    else if (dev.status === "sold-out" && status !== "sold") err("status", `${dev.name} is marked sold out, but this unit is "${status}". Fix the export or the development status.`);

    let price: number | null = null;
    if (raw.price && !/^(on request|poa|-|—|κατόπιν αιτήματος)$/i.test(raw.price.trim())) {
      price = parseNumber(raw.price);
      if (!(price >= 10_000 && price <= 20_000_000)) {
        err("price", `Price "${raw.price}" is not a plausible EUR amount (leave empty for "price on request").`);
        price = null;
      }
    }
    if (price != null && status === "sold") {
      warn("price", "Price on a sold unit is ignored (sold prices are never published).");
      price = null;
    }

    let orientation: Localized | null = null;
    if (raw.orientation) {
      const key = ORIENTATION_WORDS[norm(raw.orientation)] ?? (ORIENTATION[norm(raw.orientation)] ? norm(raw.orientation) : null);
      if (key) orientation = ORIENTATION[key]!;
      else warn("orientation", `Orientation "${raw.orientation}" not recognised; omitted (use N, NE, E, … or English words).`);
    }

    let parking: boolean | null = null;
    if (raw.parking) {
      if (YES.has(norm(raw.parking))) parking = true;
      else if (NO.has(norm(raw.parking))) parking = false;
      else warn("parking", `Parking "${raw.parking}" not recognised (yes/no); omitted.`);
    }

    let floorplan: Unit["floorplan"] = null;
    if (raw.floorplan) {
      if (!/^\/media\/[\w./-]+\.(png|jpe?g|webp|avif|svg)$/i.test(raw.floorplan)) err("floorplan", `Floorplan "${raw.floorplan}" must be a path like /media/terrace-heights/plans/A101.png.`);
      else
        floorplan = {
          src: raw.floorplan,
          alt: { en: `Floorplan of residence ${raw.unit}, ${dev.name}`, el: `Κάτοψη κατοικίας ${raw.unit}, ${dev.name}`, tr: `${dev.name}, ${raw.unit} konutunun kat planı` },
          width: 1600,
          height: 1200,
          kind: "floorplan",
        };
    }

    if (status && Number.isInteger(floor) && Number.isInteger(bedrooms) && area > 5) {
      units.push({ id, developmentId: dev.id, label: raw.unit, floor, bedrooms, bathrooms, area: Math.round(area * 10) / 10, outdoorArea: outdoor != null ? Math.round(outdoor * 10) / 10 : null, status, price, orientation, parking, floorplan });
    }
  }

  const summary: ImportResult["summary"] = {};
  for (const u of units) {
    summary[u.developmentId] ??= { total: 0, available: 0 };
    summary[u.developmentId]!.total++;
    if (u.status === "available") summary[u.developmentId]!.available++;
  }
  for (const [devId, s] of Object.entries(summary)) {
    const dev = developments.find((d) => d.id === devId)!;
    if (dev.unitsTotal != null && s.total !== dev.unitsTotal) warnings.push({ row: 0, field: "development", message: `${dev.name}: ${s.total} units imported, development record says ${dev.unitsTotal}.` });
  }
  return { units: errors.length ? [] : units, errors, warnings, summary };
}
