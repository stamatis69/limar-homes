import { expect, test } from "@playwright/test";
import { decideConsent } from "./helpers";

test.describe("Development index", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("server renders every development; filters are URL-backed and shareable", async ({ page, request }) => {
    const html = await (await request.get("/projects")).text();
    for (const name of ["Terrace Heights", "Parkview Residences", "Portside Residences", "Aura Residences", "La Riviera"]) expect(html).toContain(name);
    await page.goto("/projects");
    await page.getByRole("radio", { name: "Sold out" }).check();
    await expect(page).toHaveURL(/\?status=sold-out$/);
    await expect(page.locator(".dev-entry")).toHaveCount(4);
    await expect(page.locator(".dev-entry", { hasText: "Terrace Heights" })).toHaveCount(0);
    await page.getByRole("radio", { name: "Corinthia" }).check();
    await expect(page.locator(".dev-entry")).toHaveCount(1);
    await expect(page.getByRole("status").filter({ hasText: "Showing 1" })).toBeVisible();
    // shared link restores the same filters
    await page.goto("/projects?status=selling&region=corinthia");
    await expect(page.getByText("No developments match these filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.locator(".dev-entry").first()).toBeVisible();
    await expect(page).toHaveURL(/\/projects$/);
  });
});

test.describe("Insights index", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("is static HTML with every article; category filter is URL-backed", async ({ page, request }) => {
    const html = await (await request.get("/news")).text();
    expect(html).toContain("Greece&#x27;s Golden Visa after Law 5100/2024");
    expect(html).toContain("Buying a home in Greece from abroad");
    await page.goto("/news");
    await page.getByRole("radio", { name: "Golden Visa" }).check();
    await expect(page).toHaveURL(/\?category=golden-visa$/);
    await expect(page.getByRole("link", { name: /Law 5100\/2024/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buying a home in Greece/ })).toHaveCount(0);
    await page.goto("/el/nea?category=market");
    await expect(page.getByRole("link", { name: /Αγορά κατοικίας στην Ελλάδα/ })).toBeVisible();
  });
});
