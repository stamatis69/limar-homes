import { expect, test } from "@playwright/test";
import { decideConsent } from "./helpers";

const PAGES = ["/", "/projects", "/projects/terrace-heights", "/projects/aura-residences", "/golden-visa", "/golden-visa/pathfinder", "/compare", "/enquire?development=terrace-heights", "/about", "/contact", "/news", "/news/buying-property-in-greece-from-abroad", "/privacy-policy", "/el", "/el/erga/terrace-heights", "/el/golden-visa/odigos", "/tr", "/tr/projeler/la-riviera", "/el/erga/nope"];

test("no console errors or hydration mismatches", async ({ page }) => {
  await decideConsent(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`${page.url()} ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(`${page.url()} ${m.text()}`);
  });
  for (const p of PAGES) {
    await page.goto(p, { waitUntil: "networkidle" });
  }
  expect(errors).toEqual([]);
});
