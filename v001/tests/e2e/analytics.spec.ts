import { expect, test } from "@playwright/test";
import { addToCompare, decideConsent } from "./helpers";

test.describe("Analytics respects consent and carries no PII", () => {
  test("no events reach dataLayer without consent", async ({ page }) => {
    await decideConsent(page, false);
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, "terrace-heights:B102");
    expect(await page.evaluate(() => window.dataLayer?.length ?? 0)).toBe(0);
  });

  test("with consent: funnel events fire with whitelisted, non-personal properties", async ({ page }) => {
    await decideConsent(page, true);
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, "terrace-heights:B102");
    await page.goto("/enquire?development=terrace-heights&unit=terrace-heights%3AB102");
    await page.locator("#f-firstName").fill("Nadia");
    await page.locator("#f-email").fill("nadia@example.com");
    await page.getByRole("button", { name: /Send enquiry/ }).click(); // validation errors expected
    const events = await page.evaluate(() => window.dataLayer ?? []);
    const names = events.map((e) => e.event);
    expect(names).toEqual(expect.arrayContaining(["enquiry_start", "enquiry_validation_error"]));
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain("Nadia");
    expect(serialized).not.toContain("nadia@example.com");
  });
});
