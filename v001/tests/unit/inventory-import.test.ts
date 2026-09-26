import { describe, expect, it } from "vitest";
import { developments } from "@/data/developments";
import { importInventory, parseCsv, parseNumber } from "@/lib/inventory-import";

const HEADER = "development,unit,floor,bedrooms,bathrooms,area_m2,outdoor_m2,status,price_eur,orientation,parking,floorplan";

describe("parseNumber", () => {
  it.each([
    ["56,4", 56.4], ["56.4", 56.4], ["€ 185.000", 185000], ["185,000", 185000], ["1.234,5", 1234.5], ["1,234.5", 1234.5], ["41 m²", 41], ["abc", NaN], ["", NaN],
  ])("%s → %s", (raw, expected) => {
    expect(Number.isNaN(expected) ? Number.isNaN(parseNumber(raw)) : parseNumber(raw)).toBe(Number.isNaN(expected) ? true : expected);
  });
});

describe("parseCsv", () => {
  it("handles BOM, quotes, escaped quotes, CRLF and semicolon exports", () => {
    expect(parseCsv('\uFEFFa,b\r\n"1,5","say ""hi"""\r\n')).toEqual([["a", "b"], ["1,5", 'say "hi"']]);
    expect(parseCsv("a;b\n1,5;2\n")).toEqual([["a", "b"], ["1,5", "2"]]);
  });
});

describe("importInventory", () => {
  it("imports a valid export with Greek status words, decimal commas and ground floors", () => {
    const csv = [HEADER, 'terrace-heights,A101,1,1,1,"41,5",6,Διαθέσιμο,,SE,no,', "Terrace Heights,A001,ισόγειο,2,1,58,,sold,,,yes,", "terrace-heights,B102,1,1,,33.4,,Under offer,€ 185.000,North,,"].join("\n");
    const r = importInventory(csv, developments);
    expect(r.errors).toEqual([]);
    expect(r.units).toHaveLength(3);
    expect(r.units[0]).toMatchObject({ id: "terrace-heights:A101", floor: 1, area: 41.5, status: "available", price: null, parking: false });
    expect(r.units[0]!.orientation?.el).toBe("Νοτιοανατολικός");
    expect(r.units[1]).toMatchObject({ floor: 0, status: "sold", parking: true });
    expect(r.units[2]).toMatchObject({ status: "under-offer", price: 185000, bathrooms: null });
    expect(r.summary["terrace-heights"]).toEqual({ total: 3, available: 1 });
    // unit count differs from the development record → warning, not error
    expect(r.warnings.some((w) => w.message.includes("units imported"))).toBe(true);
  });

  it("blocks the whole import on any invalid row and reports line numbers", () => {
    const csv = [HEADER, "terrace-heights,A101,1,1,1,41,,available,,,,", "atlantis,Z1,1,1,1,40,,available,,,,", "terrace-heights,A101,2,1,1,40,,available,,,,", "terrace-heights,A102,x,1,1,40,,maybe,12,,,", "parkview-residences,P1,1,1,1,40,,available,,,,"].join("\n");
    const r = importInventory(csv, developments);
    expect(r.units).toEqual([]); // nothing partially imported
    const byLine = (n: number) => r.errors.filter((e) => e.row === n).map((e) => e.field);
    expect(byLine(3)).toEqual(["development"]);
    expect(byLine(4)).toEqual(["unit"]); // duplicate
    expect(byLine(5)).toEqual(expect.arrayContaining(["floor", "status", "price"]));
    expect(byLine(6)).toEqual(["status"]); // sold-out development cannot have available units
  });

  it("never publishes a price on a sold unit and requires media paths under /media", () => {
    const csv = [HEADER, "terrace-heights,A101,1,1,1,41,,sold,€ 200.000,,,", "terrace-heights,A102,1,1,1,41,,available,,,,C:\\plans\\a.png"].join("\n");
    const r = importInventory(csv, developments);
    expect(r.errors.map((e) => e.field)).toEqual(["floorplan"]);
    expect(r.warnings.some((w) => w.field === "price")).toBe(true);
  });

  it("refuses a header-only export so the live schedule is never wiped", () => {
    expect(importInventory(HEADER + "\n# example only\n", developments).errors[0]!.message).toContain("No unit rows");
  });

  it("reports missing required columns and ignores comment lines", () => {
    const r = importInventory("# note\ndevelopment,unit,floor\nterrace-heights,A1,1", developments);
    expect(r.errors.map((e) => e.field)).toEqual(expect.arrayContaining(["bedrooms", "area", "status"]));
  });
});
