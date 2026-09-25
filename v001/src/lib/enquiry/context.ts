import "server-only";
import { getCatalog, resolveUnit } from "@/data/catalog";
import type { EnquiryContext } from "@/components/enquiry/EnquiryForm";
import { INTERESTS, PF_LOCATIONS, PF_OUTCOMES, PF_PROPERTY, PF_ROUTES, BUDGETS } from "@/lib/enquiry/validation";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Resolves enquiry context from the URL against canonical data. Unknown IDs are dropped, never trusted. */
export function resolveEnquiryContext(sp: SP): { context: EnquiryContext; defaultInterest: string } {
  const catalog = getCatalog();
  const unitRaw = catalog.inventory.units.find((u) => u.id === one(sp.unit));
  const devId = unitRaw?.developmentId ?? one(sp.development);
  const dev = catalog.developments.find((d) => d.id === devId);
  const unit = unitRaw && dev ? resolveUnit(unitRaw, dev) : null;
  const compared = one(sp.compare)
    .split(",")
    .filter((id) => id && id !== unit?.id)
    .slice(0, 3)
    .map((id) => {
      const u = catalog.inventory.units.find((x) => x.id === id);
      const d = u && catalog.developments.find((x) => x.id === u.developmentId);
      return u && d ? resolveUnit(u, d) : null;
    })
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const pfOutcome = one(sp.pf);
  const pfRoute = one(sp.route);
  const pathfinder =
    (PF_OUTCOMES as readonly string[]).includes(pfOutcome) && (PF_ROUTES as readonly string[]).includes(pfRoute)
      ? {
          outcome: pfOutcome,
          route: pfRoute,
          budget: [...BUDGETS, "undisclosed"].includes(one(sp.budget)) ? one(sp.budget) : "",
          location: (PF_LOCATIONS as readonly string[]).includes(one(sp.loc)) ? one(sp.loc) : "",
          property: (PF_PROPERTY as readonly string[]).includes(one(sp.prop)) ? one(sp.prop) : "",
        }
      : null;

  const requested = one(sp.interest);
  const defaultInterest = (INTERESTS as readonly string[]).includes(requested) ? requested : pathfinder ? "golden-visa" : dev ? "purchase" : "general";
  const source = one(sp.source).replace(/[^\w-]/g, "").slice(0, 40) || "direct";

  return {
    context: {
      development: dev ? { id: dev.id, name: dev.name, slug: dev.slug, locality: dev.locality, city: dev.city } : null,
      unit,
      compared,
      pathfinder,
      source,
    },
    defaultInterest,
  };
}
