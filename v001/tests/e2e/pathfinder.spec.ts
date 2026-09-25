import { expect, test, type Page } from "@playwright/test";
import { decideConsent, pickOption } from "./helpers";

async function answer(page: Page, choices: string[]) {
  await page.goto("/golden-visa/pathfinder");
  await page.getByRole("button", { name: /^(Start|Start again)/ }).click();
  for (const c of choices) await pickOption(page, c);
  await expect(page.locator(".pf-result")).toBeVisible();
}

const COMPACT_ATTICA = ["A home and a residence permit", "€250,000 – €400,000", "Athens & Attica", "A compact city apartment", "For me or my family", "Within 6 months", "Only me"];
const FAMILY_800 = ["A residence permit", "€800,000 or more", "Athens & Attica", "A family-size home", "For me or my family", "In 6–18 months", "Family with children"];
const OUTSIDE_400 = ["A residence permit", "€400,000 – €800,000", "Outside Attica", "A family-size home", "Long-term rental", "Just exploring", "Me and my partner"];
const LOW = ["A residence permit", "Under €250,000", "Athens & Attica", "A compact city apartment", "For me or my family", "Just exploring", "Only me"];

test.describe("Golden Visa Pathfinder (brief §61)", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("different answers produce different, explained outcomes with a next step", async ({ page }) => {
    const seen = new Map<string, string>();
    for (const [name, choices] of Object.entries({ COMPACT_ATTICA, FAMILY_800, OUTSIDE_400, LOW })) {
      await answer(page, choices);
      const result = page.locator(".pf-result");
      const outcome = (await result.getAttribute("data-outcome"))!;
      seen.set(name, outcome);
      // explains why, gives guidance, lists open professional questions
      await expect(result.getByRole("heading", { name: "Why this result" })).toBeVisible();
      await expect(result.locator("#pf-why + ul li").first()).toBeVisible();
      await expect(result.getByRole("heading", { name: "Still to be checked by a professional" })).toBeVisible();
      // exactly one primary next action, never a dead end
      await expect(result.locator("#pf-next ~ .cta-row .btn--primary")).toHaveCount(1);
      // responsible language
      await expect(result).toContainText("not legal advice");
      await expect(result).not.toContainText(/you are eligible|guaranteed|you qualify/i);
      // sold-out developments never presented as actionable matches
      for (const sold of ["Parkview Residences", "Portside Residences", "Aura Residences", "La Riviera"]) {
        await expect(result.locator(".pf-matches li", { hasText: sold })).toHaveCount(0);
      }
    }
    expect(seen.get("COMPACT_ATTICA")).toBe("specialist");
    expect(seen.get("FAMILY_800")).toBe("inventory-mismatch");
    expect(seen.get("OUTSIDE_400")).toBe("inventory-mismatch");
    expect(seen.get("LOW")).toBe("outside-scope");
    expect(new Set(seen.values()).size).toBeGreaterThanOrEqual(3);
  });

  test("compact Attica result matches current inventory and carries context into the enquiry", async ({ page }) => {
    await answer(page, COMPACT_ATTICA);
    const result = page.locator(".pf-result");
    await expect(result).toContainText("€250,000: a commercial-to-residential conversion");
    await expect(result.locator(".pf-matches")).toContainText("Terrace Heights");
    await result.getByRole("link", { name: "Speak with a Golden Visa specialist" }).click();
    await expect(page).toHaveURL(/\/enquire\?.*pf=specialist/);
    await expect(page.locator(".context-card")).toContainText("Specialist review recommended");
    await expect(page.locator(".context-card")).toContainText("Terrace Heights");
    await expect(page.locator('input[name="interest"][value="golden-visa"]')).toBeChecked();
    await expect(page.locator("#f-budget")).toHaveValue("250-400");
  });

  test("back, edit and state survival across navigation", async ({ page }) => {
    await page.goto("/golden-visa/pathfinder");
    await page.getByRole("button", { name: "Start" }).click();
    await pickOption(page, "A residence permit");
    await pickOption(page, "€800,000 or more");
    await expect(page.getByText("Question 3 of 7")).toBeVisible();
    // in-flow back keeps the previous answer
    await page.getByRole("button", { name: "← Back" }).click();
    await expect(page.locator('input[name="pf-budget"][value="800-plus"]')).toBeChecked();
    await page.getByRole("button", { name: /Continue/ }).click();
    for (const c of FAMILY_800.slice(2)) await pickOption(page, c);
    await expect(page.locator(".pf-result")).toHaveAttribute("data-outcome", "inventory-mismatch");
    // edit one answer from the result
    await page.getByRole("button", { name: /Edit: What kind of property\?/ }).click();
    await pickOption(page, "A compact city apartment");
    for (const q of [5, 6, 7]) {
      await expect(page.getByText(`Question ${q} of 7`)).toBeVisible();
      await page.getByRole("button", { name: /Continue/ }).click();
    }
    await expect(page.locator(".pf-result")).toContainText("Compact apartments (under 120 m²)");
    // leave to a development and come back with browser Back → same result restored
    await page.locator(".pf-matches").getByRole("link", { name: "View available residences" }).click();
    await expect(page).toHaveURL(/terrace-heights/);
    await page.goBack();
    await expect(page.locator(".pf-result")).toBeVisible();
    await expect(page.locator(".pf-result")).toContainText("Compact apartments (under 120 m²)");
  });

  test("keyboard selection does not auto-advance", async ({ page }) => {
    await page.goto("/golden-visa/pathfinder");
    await page.getByRole("button", { name: "Start" }).click();
    await page.locator('input[name="pf-objective"]').first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByText("Question 1 of 7")).toBeVisible();
    await expect(page.locator('input[name="pf-objective"][value="both"]')).toBeChecked();
    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Question 2 of 7")).toBeVisible();
  });
});
