import { expect, test } from "@playwright/test";
import { addToCompare, decideConsent, tray } from "./helpers";

const A = "terrace-heights:B102"; // Terrace Heights, available
const B = "fixture-stress:1.01"; // second development, available, has price

test.describe("Comparison acceptance (brief §60)", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("tray persists across developments, compares live data, empties cleanly", async ({ page }) => {
    // 1–3. Development A → add unit A → tray appears
    await page.goto("/projects/terrace-heights");
    await expect(tray(page)).toHaveCount(0);
    await addToCompare(page, A);
    await expect(tray(page)).toBeVisible();
    await expect(tray(page).locator(`[data-unit="${A}"]`)).toContainText("B102");
    await expect(tray(page)).toContainText("1 of 4 selected");

    // 4–6. Navigate to development B → unit A remains → add unit B
    await page.goto("/projects/fixture-stress-test-residences");
    await expect(tray(page).locator(`[data-unit="${A}"]`)).toBeVisible();
    await addToCompare(page, B);
    await expect(tray(page)).toContainText("2 of 4 selected");

    // 7–9. Open comparison → both units from current canonical data
    await tray(page).getByRole("link", { name: /Compare \(2\)/ }).click();
    await expect(page).toHaveURL(/\/compare$/);
    const table = page.locator(".compare-desktop table");
    await expect(table.locator("thead")).toContainText("B102");
    await expect(table.locator("thead")).toContainText("1.01");
    await expect(table).toContainText("Terrace Heights");
    await expect(table).toContainText("Price on request"); // Terrace Heights: no invented price
    await expect(table).toContainText(/€\d/); // fixture unit carries a listed price
    await expect(table.locator("tr", { hasText: "Status" })).toContainText("Available");
    // factual difference tags, never "best"/"recommended"
    await expect(table).toContainText("Largest interior");
    await expect(page.locator("body")).not.toContainText(/best value|recommended|smartest/i);

    // 10–11. Remove A → B remains
    await table.getByRole("button", { name: "Remove B102" }).click();
    await expect(table.locator("thead")).not.toContainText("B102");
    await expect(table.locator("thead")).toContainText("1.01");

    // 12–13. Remove B → empty state; tray gone everywhere
    await table.getByRole("button", { name: "Remove 1.01" }).click();
    await expect(page.getByText("No residences selected yet.")).toBeVisible();
    await page.goto("/projects/terrace-heights");
    await expect(tray(page)).toHaveCount(0);
  });

  test("selection survives refresh and route changes (14)", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, A);
    await page.reload();
    await expect(tray(page).locator(`[data-unit="${A}"]`)).toBeVisible();
    await page.goto("/golden-visa");
    await expect(tray(page).locator(`[data-unit="${A}"]`)).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("limar.compare.v1") ?? "{}"));
    expect(stored.ids).toEqual([A]); // IDs only — no cached prices or statuses to go stale
    expect(JSON.stringify(stored)).not.toMatch(/price|area|€/);
  });

  test("a unit that became unavailable shows its current status (15–16)", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, A);
    await page.goto("/projects/fixture-stress-test-residences");
    await addToCompare(page, B);
    // Simulate the canonical source changing: A is now sold, B has been withdrawn from the schedule.
    await page.route("**/api/units?**", async (route) => {
      const res = await route.fetch();
      const body = await res.json();
      body.units = body.units.filter((u: { id: string }) => u.id !== B).map((u: { id: string; status: string }) => (u.id === A ? { ...u, status: "sold" } : u));
      body.missing = [B];
      await route.fulfill({ json: body });
    });
    await page.goto("/compare");
    const table = page.locator(".compare-desktop table");
    await expect(table.locator("tr", { hasText: "Status" })).toContainText("Sold");
    await expect(table).toContainText("Status updated since you added it");
    await expect(page.getByText("No longer in the schedule")).toBeVisible();
    // sold units are not offered for enquiry
    await expect(table.getByRole("link", { name: "Enquire about this residence" })).toHaveCount(0);
  });

  test("limit is enforced and communicated", async ({ page }) => {
    await page.goto("/projects/fixture-stress-test-residences");
    for (const id of ["fixture-stress:0.01", "fixture-stress:0.02", "fixture-stress:1.01", "fixture-stress:1.03"]) await addToCompare(page, id);
    await page.locator('[data-compare="fixture-stress:2.02"]').click();
    await expect(page.getByRole("status").filter({ hasText: "up to 4 residences" })).toBeVisible();
    await expect(page.locator('[data-compare="fixture-stress:2.02"]')).toHaveAttribute("aria-pressed", "false");
    await tray(page).getByRole("button", { name: "Clear all" }).click();
    await expect(tray(page)).toHaveCount(0);
  });
});
