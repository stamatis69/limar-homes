import { expect, test } from "@playwright/test";
import { decideConsent } from "./helpers";

test.describe("Multilingual routing and SEO", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("localized routes, lang attributes and hreflang", async ({ page }) => {
    for (const [url, lang, h1] of [
      ["/", "en", "Built to be lived in."],
      ["/el", "el", "Χτισμένα για να τα ζεις."],
      ["/tr", "tr", "Yaşamak için inşa edildi."],
      ["/el/golden-visa", "el", "Η ελληνική Golden Visa"],
      ["/tr/projeler", "tr", "Projeler"],
    ] as const) {
      await page.goto(url);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("h1").first()).toContainText(h1);
    }
    await page.goto("/el/erga/terrace-heights");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/el\/erga\/terrace-heights$/);
    await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute("href", /\/tr\/projeler\/terrace-heights$/);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", /\/projects\/terrace-heights$/);
  });

  test("legacy URLs: preserved, canonicalised, redirected or gone", async ({ request }) => {
    const noFollow = { maxRedirects: 0 };
    expect((await request.get("/projects/aura-residences")).status()).toBe(200);
    const en = await request.get("/en/projects", noFollow);
    expect(en.status()).toBe(308);
    expect(en.headers().location).toMatch(/\/projects$/);
    const el = await request.get("/el/projects/la-riviera", noFollow);
    expect(el.headers().location).toMatch(/\/el\/erga\/la-riviera$/);
    const singular = await request.get("/projects/parkview-residence", noFollow);
    expect([301, 308]).toContain(singular.status());
    expect(singular.headers().location).toMatch(/\/projects\/parkview-residences$/);
    expect((await request.get("/nyt-vote")).status()).toBe(410);
    expect((await request.get("/no-such-page")).status()).toBe(404);
  });

  test("sitemap, robots and structured data are honest", async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/el/erga/terrace-heights");
    expect(sitemap).toContain("/tr/golden-visa/rehber");
    expect(sitemap).not.toContain("/compare");
    expect(sitemap).not.toContain("fixture-stress");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    await page.goto("/projects/terrace-heights");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const all = ld.join(" ");
    expect(all).toContain('"ApartmentComplex"');
    expect(all).not.toMatch(/"price"|"offers"|aggregateRating|"geo"|Merqon/);
  });

  test("Greek uppercase labels drop tonos; Turkish casing is correct", async ({ page }) => {
    await page.goto("/el/erga/terrace-heights");
    // CSS uppercase with lang=el: the rendered label must not show accented capitals
    const label = page.locator(".metric .label").first();
    await expect.poll(() => label.evaluate((el) => (el as HTMLElement).innerText)).toBe("ΚΑΤΟΙΚΙΕΣ"); // "Κατοικίες" without tonos
    await page.goto("/tr/golden-visa");
    const tr = await page.locator(".kicker").first().evaluate((el) => (el as HTMLElement).innerText);
    expect(tr).toBe("YATIRIM YOLUYLA OTURUM"); // dotless ı → I under lang="tr"
  });
});
