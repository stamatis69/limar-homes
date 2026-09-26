import { expect, test, type Page } from "@playwright/test";
import { decideConsent } from "./helpers";

const opacity = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => Number(getComputedStyle(el).opacity));

test.describe("Experience layer: 3D, scroll motion, fallbacks", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("hero massing model is labelled as a schematic and renders", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator(".stage-hero canvas.massing-canvas");
    await expect(canvas).toHaveAttribute("role", "img");
    await expect(canvas).toHaveAttribute("aria-label", /schematic 3D massing.*not the architectural design/i);
    // The e2e build sets NEXT_PUBLIC_FORCE_WEBGL=1, so the model renders even on software WebGL.
    await expect(page.locator(".stage-hero .massing")).toHaveClass(/is-ready/, { timeout: 15_000 });
    await expect(page.locator(".stage-hero .massing-poster")).toHaveCSS("opacity", "0");
    // Caption and accessible name describe what is actually on screen.
    await expect(page.locator(".stage-hero .massing-caption")).toContainText("not the architectural design");
    await expect(canvas).not.toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".stage-hero .massing-poster")).toHaveAttribute("aria-hidden", "true");
  });

  test("blocks reveal as they scroll into view; header tone follows the section beneath it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    await expect(page.locator("html")).toHaveAttribute("data-header-tone", "dark");
    const evidence = page.locator("#evidence-title").locator("xpath=ancestor::header[contains(@class,'chapter-head')]");
    await expect(evidence).not.toHaveClass(/is-in/);
    expect(await evidence.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
    await evidence.scrollIntoViewIfNeeded();
    await expect(evidence).toHaveClass(/is-in/);
    await expect.poll(() => evidence.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    // With the evidence chapter aligned under the header, the header sits over a light section.
    await evidence.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(page.locator("html")).toHaveAttribute("data-header-tone", "light");
  });

  test("counters finish on the exact published figure", async ({ page }) => {
    await page.goto("/");
    const amounts = page.locator(".routes--glass .route-amount");
    await amounts.first().scrollIntoViewIfNeeded();
    await expect(amounts).toHaveText(["€800,000", "€400,000", "€250,000"], { timeout: 6000 });
  });

  test("keyboard focus inside the pinned portfolio brings the card on screen", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".portfolio-card");
    const last = cards.last();
    await last.focus();
    await expect
      .poll(async () => {
        const r = await last.boundingBox();
        const vw = page.viewportSize()!.width;
        return r ? r.x >= 0 && r.x + r.width <= vw + 1 : false;
      })
      .toBe(true);
  });

  test("reduced motion: everything visible and final, no smooth-scroll hijack", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    await expect(page.locator("html")).not.toHaveClass(/has-smooth-scroll/);
    expect(await opacity(page, ".chapter-head")).toBe(1);
    expect(await page.locator(".scrub-words .w:not(.is-lit)").count()).toBe(0);
    const transform = await page.locator(".portfolio-track").evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe("none");
    await ctx.close();
  });

  test("without JavaScript nothing is hidden", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    for (const sel of [".chapter-head", ".practice > div", ".ledger-row, .portfolio-card", ".footer-grid > *"]) {
      expect(await opacity(page, sel), sel).toBe(1);
    }
    await expect(page.locator(".stage-hero .massing-poster svg")).toBeVisible();
    await ctx.close();
  });
});
