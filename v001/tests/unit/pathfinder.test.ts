import { describe, expect, it } from "vitest";
import { activeSteps, evaluate, type Answers, type InventoryEntry } from "@/lib/pathfinder";

// Mirrors canonical data: one selling development in Attica (30–60 m²), the rest sold out.
const inventory: InventoryEntry[] = [
  { id: "terrace-heights", slug: "terrace-heights", status: "selling", region: "attica", sizeMax: 60, goldenVisaStatement: true, available: null },
  { id: "parkview-residences", slug: "parkview-residences", status: "sold-out", region: "attica", sizeMax: 55, goldenVisaStatement: true, available: 0 },
  { id: "la-riviera", slug: "la-riviera", status: "sold-out", region: "corinthia", sizeMax: null, goldenVisaStatement: true, available: 0 },
];
const base: Answers = { objective: "residency", location: "attica", property: "compact", use: "own", timeline: "soon", family: "solo" };

describe("pathfinder", () => {
  it("Attica + compact + €250–400k → conversion route, specialist review, Terrace Heights matched", () => {
    const r = evaluate({ ...base, budget: "250-400" }, inventory);
    expect(r.route).toBe("250k");
    expect(r.outcome).toBe("specialist");
    expect(r.matches).toEqual(["terrace-heights"]);
    expect(r.guidance).toContain("conversionRoute");
    expect(r.actions[0]).toEqual({ key: "specialist", primary: true });
  });

  it("Attica + family-size + €800k+ → €800k route but current inventory does not match (all < 120 m²)", () => {
    const r = evaluate({ ...base, property: "family", budget: "800-plus" }, inventory);
    expect(r.route).toBe("800k");
    expect(r.outcome).toBe("inventory-mismatch");
    expect(r.matches).toEqual([]);
    expect(r.limits).toContain("limarAtticaOnly");
    expect(r.reasons).toContain("familyMeets120");
  });

  it("Outside Attica + €400–800k + family → €400k route; sold-out La Riviera never actionable", () => {
    const r = evaluate({ ...base, location: "outside", property: "family", budget: "400-800" }, inventory);
    expect(r.route).toBe("400k");
    expect(r.matches).not.toContain("la-riviera");
    expect(r.outcome).toBe("inventory-mismatch");
    expect(r.limits).toContain("limarNoOutside");
  });

  it("€800k+ but compact apartment → falls back to conversion route with explanation", () => {
    const r = evaluate({ ...base, budget: "800-plus" }, inventory);
    expect(r.route).toBe("250k");
    expect(r.reasons).toContain("compactNeedsConversion");
  });

  it("under €250k → outside scope with non-property alternatives", () => {
    const r = evaluate({ ...base, budget: "under-250" }, inventory);
    expect(r.outcome).toBe("outside-scope");
    expect(r.route).toBe("none");
    expect(r.guidance).toContain("nonPropertyRoutes");
  });

  it("undisclosed budget → more information required", () => {
    expect(evaluate({ ...base, budget: "undisclosed" }, inventory).outcome).toBe("more-info");
  });

  it("short-term letting intent is flagged and forces specialist review", () => {
    const r = evaluate({ ...base, budget: "250-400", use: "short-let" }, inventory);
    expect(r.limits[0]).toBe("shortLet");
    expect(r.guidance[0]).toBe("noShortLet");
    expect(r.outcome).toBe("specialist");
  });

  it("investment objective skips the family question and returns property view", () => {
    const a: Answers = { ...base, objective: "investment", budget: "250-400" };
    expect(activeSteps(a)).not.toContain("family");
    expect(evaluate(a, inventory).outcome).toBe("property-only");
  });

  it("every outcome has exactly one primary action and a reason", () => {
    const budgets = ["under-250", "250-400", "400-800", "800-plus", "undisclosed"] as const;
    const locs = ["attica", "outside", "open"] as const;
    const props = ["compact", "family", "open"] as const;
    const objectives = ["residency", "both", "investment", "unsure"] as const;
    const outcomes = new Set<string>();
    for (const budget of budgets) for (const location of locs) for (const property of props) for (const objective of objectives) {
      const r = evaluate({ ...base, budget, location, property, objective }, inventory);
      outcomes.add(r.outcome);
      expect(r.actions.filter((x) => x.primary)).toHaveLength(1);
      expect(r.reasons.length).toBeGreaterThan(0);
      // sold-out developments are never presented as matches
      expect(r.matches.every((id) => id === "terrace-heights")).toBe(true);
    }
    expect(outcomes.size).toBeGreaterThanOrEqual(5);
  });

  it("family members add documentation guidance and an open question", () => {
    const r = evaluate({ ...base, budget: "250-400", family: "parents" }, inventory);
    expect(r.guidance).toContain("familyDocs");
    expect(r.open).toContain("family");
  });
});
