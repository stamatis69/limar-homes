import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { addToCompare, decideConsent, pickOption } from "./helpers";

const PAGES = ["/", "/projects", "/projects/terrace-heights", "/projects/la-riviera", "/golden-visa", "/golden-visa/pathfinder", "/about", "/contact", "/news", "/news/greek-golden-visa-after-law-5100-2024", "/privacy-policy", "/el", "/tr/projeler/terrace-heights", "/does-not-exist"];

/**
 * Scroll reveals fade content in over ~1s. Contrast is judged on the settled page, not on a frame
 * captured mid-fade, so wait until every finite animation/transition has finished (infinite
 * decorative loops such as the scroll cue are ignored).
 */
async function settle(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity),
    undefined,
    { timeout: 8000 },
  );
}

async function audit(page: import("@playwright/test").Page, label: string) {
  await settle(page);
  const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${label}: ${v.id} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
}

test.describe("Accessibility (WCAG 2.2 AA, axe)", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("static pages", async ({ page }) => {
    test.setTimeout(150_000); // 14 pages, each audited after its entrance animations settle
    for (const p of PAGES) {
      await page.goto(p);
      await audit(page, p);
    }
  });

  test("interactive states: explorer details, comparison, pathfinder result, enquiry errors", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await page.locator(".floor-list button", { hasText: "03" }).click();
    await page.locator("li.unit-row", { hasText: "B302" }).getByRole("button", { name: "Details" }).click();
    await audit(page, "explorer-details");
    await page.locator(".floor-list button", { hasText: "All floors" }).click();
    await addToCompare(page, "terrace-heights:B102");
    await addToCompare(page, "terrace-heights:D104");
    await page.goto("/compare");
    await audit(page, "compare");
    await page.goto("/golden-visa/pathfinder");
    await page.getByRole("button", { name: "Start" }).click();
    await audit(page, "pathfinder-question");
    for (const c of ["A residence permit", "€250,000 – €400,000", "Athens & Attica", "A compact city apartment", "For me or my family", "Within 6 months", "Only me"]) await pickOption(page, c);
    await audit(page, "pathfinder-result");
    await page.goto("/enquire?development=terrace-heights");
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    await audit(page, "enquiry-errors");
  });

  test("keyboard: skip link, floor selection and focus visibility", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    const floorBtn = page.locator(".floor-list button", { hasText: "03" });
    await floorBtn.focus();
    await page.keyboard.press("Enter");
    await expect(floorBtn).toHaveAttribute("aria-pressed", "true");
    const outline = await floorBtn.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("reduced motion disables drawing animation", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    const anim = await page.locator(".is-animated .elev-band").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    await ctx.close();
  });
});
