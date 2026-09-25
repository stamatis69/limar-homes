import type { Development, Inventory, Unit, UnitStatus } from "@/lib/types";

/**
 * DEMONSTRATION / QA FIXTURE — NOT REAL AVAILABILITY.
 *
 * Loaded only when LIMAR_INVENTORY=fixture. The site shows a persistent banner in this mode
 * and `next.config.ts` refuses to build it for LIMAR_DEPLOY_ENV=production.
 * It exists to exercise the explorer, comparison, Pathfinder and enquiry flows and to
 * stress-test the UI (long names, many units, missing plans, mixed states, prices).
 */

const statusCycle: UnitStatus[] = ["available", "available", "sold", "available", "under-offer", "reserved", "sold", "available"];

function terraceHeightsDemo(): Unit[] {
  const units: Unit[] = [];
  const letters = ["A", "B", "C", "D", "E", "F"];
  let i = 0;
  for (let floor = 1; floor <= 4; floor++) {
    for (let bay = 0; bay < 6; bay++) {
      const bedrooms = bay % 3 === 2 ? 2 : 1;
      const area = Math.round((bedrooms === 2 ? 52 + bay * 1.3 + floor * 0.4 : 31 + bay * 2.1 + floor * 0.3) * 10) / 10;
      units.push({
        id: `terrace-heights:${letters[bay]}${floor}0${bay + 1}`,
        developmentId: "terrace-heights",
        label: `${letters[bay]}${floor}0${bay + 1}`,
        floor,
        bedrooms,
        bathrooms: 1,
        area,
        outdoorArea: bay % 2 === 0 ? Math.round((4 + floor) * 10) / 10 : null,
        status: statusCycle[i % statusCycle.length]!,
        price: null,
        orientation: null,
        parking: null,
        floorplan:
          floor === 3 && bay === 1
            ? {
                src: "/fixtures/sample-plan.svg",
                alt: { en: "Sample plan (fixture)", el: "Δείγμα κάτοψης (fixture)", tr: "Örnek plan (fixture)" },
                width: 800,
                height: 600,
                kind: "floorplan",
              }
            : null,
      });
      i++;
    }
  }
  return units;
}

export const fixtureDevelopment: Development = {
  id: "fixture-stress",
  slug: "fixture-stress-test-residences",
  sheet: "99",
  name: "Νέα Σμύρνη Garden Residences — Extended Residential Programme (Fixture)",
  status: "selling",
  region: "attica",
  locality: { en: "Nea Smyrni (fixture)", el: "Νέα Σμύρνη (δοκιμαστικό)", tr: "Nea Smyrni (test verisi)" },
  city: { en: "Athens", el: "Αθήνα", tr: "Atina" },
  address: { street: "Fixture street 1", postalCode: null, locality: "Nea Smyrni" },
  coordinates: null,
  completion: { year: 2028, label: { en: "2028 (fixture)", el: "2028 (δοκιμαστικό)", tr: "2028 (test)" } },
  unitsTotal: 42,
  unitsTotalLabel: { en: "42", el: "42", tr: "42" },
  sizeMin: 28,
  sizeMax: 164,
  bedroomsMin: 1,
  bedroomsMax: 4,
  energyClass: "A",
  energyClassLabel: "A",
  floors: 7,
  amenities: ["elevator", "parking", "garden"],
  goldenVisa: { limarStatement: false, route: "unconfirmed" },
  media: { hero: null, gallery: [] },
  brochure: null,
  drawing: { floors: 6, bays: 6, roof: "terrace", ground: "garden", features: ["garden", "pergola"], illustrative: true },
  copy: {
    tagline: {
      en: "QA fixture with a deliberately long name to stress-test layouts in every language and viewport.",
      el: "Δοκιμαστικό έργο με σκόπιμα μεγάλο όνομα για τον έλεγχο της διάταξης σε όλες τις γλώσσες και οθόνες, με εκτενή ελληνικά κείμενα.",
      tr: "Tüm dillerde ve ekran boyutlarında yerleşimi zorlamak için bilerek uzun adlandırılmış test projesi; uzun Türkçe metinlerle.",
    },
    intro: {
      en: "Not a real development. Contains 42 units across seven floors, including units without floorplans, with prices, under offer and reserved.",
      el: "Δεν είναι πραγματικό έργο. Περιλαμβάνει 42 μονάδες σε επτά ορόφους, με και χωρίς κάτοψη, με τιμές, υπό διαπραγμάτευση και δεσμευμένες.",
      tr: "Gerçek bir proje değildir. Yedi katta, planı olmayan, fiyatlı, teklif aşamasında ve rezerve edilmiş birimler dahil 42 birim içerir.",
    },
    architecture: { en: "Fixture.", el: "Δοκιμαστικό.", tr: "Test." },
    location: { en: "Fixture.", el: "Δοκιμαστικό.", tr: "Test." },
    investment: { en: "Fixture.", el: "Δοκιμαστικό.", tr: "Test." },
  },
  unverified: [],
};

function stressUnits(): Unit[] {
  const units: Unit[] = [];
  let i = 0;
  for (let floor = 0; floor <= 6; floor++) {
    for (let bay = 1; bay <= 6; bay++) {
      const bedrooms = floor === 6 ? 4 : ((bay + floor) % 3) + 1;
      const area = floor === 6 ? 150 + bay * 2.3 : 28 + bedrooms * 17 + bay * 1.7;
      const status = statusCycle[(i + 3) % statusCycle.length]!;
      units.push({
        id: `fixture-stress:${floor}.${String(bay).padStart(2, "0")}`,
        developmentId: "fixture-stress",
        label: `${floor}.${String(bay).padStart(2, "0")}`,
        floor,
        bedrooms,
        bathrooms: bedrooms >= 3 ? 2 : 1,
        area: Math.round(area * 10) / 10,
        outdoorArea: floor === 0 ? 24.5 : floor === 6 ? 60 : null,
        status,
        price: i % 4 === 0 ? null : Math.round((area * 4150 + floor * 9000) / 1000) * 1000,
        orientation: bay <= 3
          ? { en: "South-east", el: "Νοτιοανατολικός", tr: "Güneydoğu" }
          : { en: "North-west", el: "Βορειοδυτικός", tr: "Kuzeybatı" },
        parking: bedrooms >= 2 ? true : false,
        floorplan: null,
      });
      i++;
    }
  }
  return units;
}

export const fixtureInventory: Inventory = {
  source: "fixture",
  asOf: "2026-09-25T00:00:00Z",
  units: [...terraceHeightsDemo(), ...stressUnits()],
};
