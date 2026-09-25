import { expect, test } from "@playwright/test";
import { addToCompare, decideConsent, pickOption, tray } from "./helpers";

const PAGES = ["/", "/projects", "/projects/terrace-heights", "/projects/fixture-stress-test-residences", "/golden-visa", "/golden-visa/pathfinder", "/compare", "/enquire?development=terrace-heights", "/about", "/contact", "/news", "/el", "/el/erga/terrace-heights", "/tr/golden-visa"];

test.describe("Mobile (brief §64)", () => {
  test("no horizontal overflow on key pages", async ({ page }) => {
    await decideConsent(page);
    for (const p of PAGES) {
      await page.goto(p);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `overflow on ${p}`).toBeLessThanOrEqual(0);
    }
  });

  test("menu and language switching work", async ({ page }) => {
    await decideConsent(page);
    await page.goto("/projects/terrace-heights");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator("#mobile-nav")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav")).toHaveCount(0);
    await page.getByRole("link", { name: "Ελληνικά" }).click();
    await expect(page).toHaveURL(/\/el\/erga\/terrace-heights$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "el");
  });

  test("bottom dock never stacks consent, tray and CTA", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await expect(page.locator(".dock .consent")).toBeVisible();
    await expect(page.locator(".dock .tray, .dock .context-cta")).toHaveCount(0);
    await page.getByRole("button", { name: "Essential only" }).click();
    await expect(page.locator(".dock .consent")).toHaveCount(0);
    await expect(page.locator(".dock .context-cta")).toBeVisible(); // contextual enquiry CTA
    await addToCompare(page, "terrace-heights:B102");
    await expect(tray(page)).toBeVisible();
    await expect(page.locator(".dock .context-cta")).toHaveCount(0); // tray replaces the CTA
    // the dock never covers the last content: body padding matches dock height
    const [pad, dockH] = await page.evaluate(() => [parseFloat(getComputedStyle(document.body).paddingBottom), document.querySelector(".dock")!.getBoundingClientRect().height]);
    expect(Math.abs(pad - dockH)).toBeLessThan(2);
  });

  test("comparison uses a one-unit-at-a-time model", async ({ page }) => {
    await decideConsent(page);
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, "terrace-heights:B102");
    await addToCompare(page, "terrace-heights:D104");
    await page.goto("/compare");
    await expect(page.locator(".compare-desktop")).toBeHidden();
    await expect(page.locator(".compare-mobile")).toBeVisible();
    await expect(page.getByText("Showing 1 of 2")).toBeVisible();
    await page.getByRole("button", { name: "Next residence" }).click();
    await expect(page.getByText("Showing 2 of 2")).toBeVisible();
  });

  test("pathfinder and enquiry are usable with touch-size targets", async ({ page }) => {
    await decideConsent(page);
    await page.goto("/golden-visa/pathfinder");
    await page.getByRole("button", { name: "Start" }).click();
    const box = await page.locator("label.pf-option").first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    for (const c of ["A residence permit", "€250,000 – €400,000", "Athens & Attica", "A compact city apartment", "For me or my family", "Within 6 months", "Only me"]) await pickOption(page, c);
    await expect(page.locator(".pf-result")).toBeVisible();
    await page.goto("/enquire?development=terrace-heights");
    const input = page.locator("#f-email");
    expect(parseFloat(await input.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16); // no iOS zoom
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
