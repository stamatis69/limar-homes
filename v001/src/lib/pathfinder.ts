/**
 * Golden Visa Pathfinder — decision logic.
 *
 * Encodes the property routes of Law 5100/2024 as summarised by published legal commentary
 * (Sept 2026; pending verification against official Ministry of Migration sources):
 *   €800k — Attica, Thessaloniki, Mykonos, Santorini, islands >3,100 residents; one property ≥120 m²
 *   €400k — elsewhere; one property ≥120 m²
 *   €250k — commercial→residential conversion or listed-building restoration; no 120 m² minimum
 *   Short-term letting (<60 days) prohibited on every route.
 *
 * It produces GUIDANCE, never an eligibility determination. Every outcome carries reasons,
 * open questions for a professional and at least one next action.
 */

export const STEPS = ["objective", "budget", "location", "property", "use", "timeline", "family"] as const;
export type Step = (typeof STEPS)[number];

export type Objective = "residency" | "both" | "investment" | "unsure";
export type Budget = "under-250" | "250-400" | "400-800" | "800-plus" | "undisclosed";
export type LocationPref = "attica" | "outside" | "open";
export type PropertyPref = "compact" | "family" | "open";
export type Use = "own" | "long-let" | "short-let" | "undecided";
export type Timeline = "soon" | "year" | "exploring";
export type Family = "solo" | "partner" | "children" | "parents";

export interface Answers {
  objective?: Objective;
  budget?: Budget;
  location?: LocationPref;
  property?: PropertyPref;
  use?: Use;
  timeline?: Timeline;
  family?: Family;
}

export const OPTIONS: { [K in Step]: string[] } = {
  objective: ["residency", "both", "investment", "unsure"],
  budget: ["under-250", "250-400", "400-800", "800-plus", "undisclosed"],
  location: ["attica", "outside", "open"],
  property: ["compact", "family", "open"],
  use: ["own", "long-let", "short-let", "undecided"],
  timeline: ["soon", "year", "exploring"],
  family: ["solo", "partner", "children", "parents"],
};

/** Steps that apply given current answers (family is irrelevant for pure investment). */
export function activeSteps(a: Answers): Step[] {
  return STEPS.filter((s) => !(s === "family" && a.objective === "investment"));
}

export type Outcome = "potential" | "specialist" | "inventory-mismatch" | "more-info" | "outside-scope" | "property-only";
export type Route = "800k" | "400k" | "250k" | "none" | "unknown";
export type ReasonKey =
  | "budgetUnder250"
  | "budget250to400Attica"
  | "budget250to400Outside"
  | "budget400to800Attica"
  | "budget400to800Outside"
  | "budget800Attica"
  | "budget800Outside"
  | "budgetUndisclosed"
  | "compactNeedsConversion"
  | "familyMeets120"
  | "shortLet"
  | "investmentOnly"
  | "locationOpen"
  | "unsureObjective"
  | "limarAtticaOnly"
  | "limarNoOutside"
  | "familyIncluded";
export type GuidanceKey =
  | "conversionRoute"
  | "checkPermit"
  | "standardRoute"
  | "noShortLet"
  | "budgetBelow"
  | "nonPropertyRoutes"
  | "investmentView"
  | "familyDocs"
  | "timelineSoon"
  | "timelineLater";
export type OpenKey = "routeConfirmation" | "transaction" | "thresholds" | "family" | "tax";
export type ActionKey = "viewAvailable" | "viewDevelopments" | "specialist" | "consultation" | "explore" | "learn";

export interface InventoryEntry {
  id: string;
  slug: string;
  status: "selling" | "sold-out";
  region: "attica" | "corinthia";
  sizeMax: number | null;
  goldenVisaStatement: boolean;
  /** null = available but count unknown; 0 = none available */
  available: number | null;
}

export interface PathfinderResult {
  outcome: Outcome;
  route: Route;
  reasons: ReasonKey[];
  limits: ReasonKey[];
  guidance: GuidanceKey[];
  open: OpenKey[];
  matches: string[];
  actions: Array<{ key: ActionKey; primary: boolean }>;
}

const REGION_OK = (loc: LocationPref | undefined, region: InventoryEntry["region"]) =>
  loc === "open" || loc === undefined || (loc === "attica" ? region === "attica" : region !== "attica");

export function isComplete(a: Answers): boolean {
  return activeSteps(a).every((s) => a[s] !== undefined);
}

export function evaluate(a: Answers, inventory: InventoryEntry[]): PathfinderResult {
  const reasons: ReasonKey[] = [];
  const limits: ReasonKey[] = [];
  const guidance: GuidanceKey[] = [];
  const open: OpenKey[] = ["routeConfirmation", "transaction", "thresholds", "tax"];
  const loc = a.location ?? "open";
  const actionable = inventory.filter((d) => d.status === "selling" && d.available !== 0);

  if (a.objective === "unsure") reasons.push("unsureObjective");
  if (loc === "open") reasons.push("locationOpen");
  if (a.timeline === "soon") guidance.push("timelineSoon");
  if (a.timeline === "year") guidance.push("timelineLater");
  const hasFamily = a.family && a.family !== "solo" && a.objective !== "investment";
  if (hasFamily) {
    reasons.push("familyIncluded");
    guidance.push("familyDocs");
    open.splice(3, 0, "family");
  }

  // Investment only: residency is secondary; show the property view and keep GV information available.
  if (a.objective === "investment") {
    const matches = actionable.filter((d) => REGION_OK(loc, d.region)).map((d) => d.id);
    return {
      outcome: "property-only",
      route: "unknown",
      reasons: ["investmentOnly", ...reasons],
      limits: a.use === "short-let" ? ["shortLet"] : [],
      guidance: ["investmentView", ...guidance],
      open: ["transaction", "tax"],
      matches,
      actions: [
        { key: matches.length ? "viewAvailable" : "explore", primary: true },
        { key: "consultation", primary: false },
        { key: "learn", primary: false },
      ],
    };
  }

  if (!a.budget || a.budget === "undisclosed") {
    return {
      outcome: "more-info",
      route: "unknown",
      reasons: ["budgetUndisclosed", ...reasons],
      limits: a.use === "short-let" ? ["shortLet"] : [],
      guidance: ["standardRoute", "conversionRoute", ...(a.use === "short-let" ? (["noShortLet"] as GuidanceKey[]) : []), ...guidance],
      open,
      matches: [],
      actions: [
        { key: "specialist", primary: true },
        { key: "learn", primary: false },
        { key: "viewDevelopments", primary: false },
      ],
    };
  }

  if (a.budget === "under-250") {
    const matches = actionable.filter((d) => REGION_OK(loc, d.region)).map((d) => d.id);
    return {
      outcome: "outside-scope",
      route: "none",
      reasons: ["budgetUnder250", ...reasons],
      limits: [],
      guidance: ["budgetBelow", "nonPropertyRoutes", ...guidance],
      open: ["thresholds", "tax"],
      matches,
      actions: [
        { key: "consultation", primary: true },
        { key: matches.length ? "viewAvailable" : "explore", primary: false },
        { key: "learn", primary: false },
      ],
    };
  }

  // Determine the reachable route from budget × location.
  let route: Route;
  if (a.budget === "250-400") {
    route = "250k";
    reasons.unshift(loc === "outside" ? "budget250to400Outside" : "budget250to400Attica");
  } else if (a.budget === "400-800") {
    if (loc === "attica") {
      route = "250k";
      reasons.unshift("budget400to800Attica");
    } else {
      route = "400k";
      reasons.unshift("budget400to800Outside");
      if (loc === "open") reasons.splice(1, 0, "budget400to800Attica");
    }
  } else {
    if (loc === "outside") {
      route = "400k";
      reasons.unshift("budget800Outside");
    } else {
      route = "800k";
      reasons.unshift("budget800Attica");
      if (loc === "open") reasons.splice(1, 0, "budget800Outside");
    }
  }

  // Property type: standard routes need one property ≥120 m² of main living space.
  if ((route === "800k" || route === "400k") && a.property === "compact") {
    route = "250k";
    reasons.push("compactNeedsConversion");
    limits.push("compactNeedsConversion");
  } else if ((route === "800k" || route === "400k") && a.property === "family") {
    reasons.push("familyMeets120");
  } else if (route === "250k" && a.property !== "family") {
    limits.push("compactNeedsConversion");
  }

  if (route === "250k") guidance.unshift("conversionRoute", "checkPermit");
  else guidance.unshift("standardRoute");

  if (a.use === "short-let") {
    reasons.push("shortLet");
    limits.unshift("shortLet");
    guidance.unshift("noShortLet");
  }

  // Match against current, actionable Limar inventory only (never sold-out developments).
  const candidates = actionable.filter((d) => d.goldenVisaStatement && REGION_OK(route === "400k" && loc !== "attica" ? "outside" : loc, d.region));
  const matches =
    route === "250k"
      ? candidates.map((d) => d.id)
      : candidates.filter((d) => d.sizeMax != null && d.sizeMax >= 120).map((d) => d.id);

  let outcome: Outcome;
  if (matches.length === 0) {
    outcome = "inventory-mismatch";
    const onSaleAttica = actionable.some((d) => d.region === "attica");
    const onSaleOutside = actionable.some((d) => d.region !== "attica");
    if (onSaleAttica) limits.push("limarAtticaOnly");
    if (!onSaleOutside && loc !== "attica") limits.push("limarNoOutside");
  } else if (route === "250k" || a.use === "short-let") {
    outcome = "specialist";
  } else {
    outcome = "potential";
  }

  const actions: PathfinderResult["actions"] =
    outcome === "potential"
      ? [
          { key: "viewAvailable", primary: true },
          { key: "specialist", primary: false },
          { key: "learn", primary: false },
        ]
      : outcome === "specialist"
        ? [
            { key: "specialist", primary: true },
            { key: "viewAvailable", primary: false },
            { key: "learn", primary: false },
          ]
        : [
            { key: "consultation", primary: true },
            { key: "explore", primary: false },
            { key: "learn", primary: false },
          ];

  return { outcome, route, reasons, limits: [...new Set(limits)], guidance: [...new Set(guidance)], open, matches, actions };
}
