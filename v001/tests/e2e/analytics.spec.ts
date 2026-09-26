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

import { readFileSync } from "node:fs";
import path from "node:path";

const lastDelivered = () => {
  const lines = readFileSync(path.join(__dirname, "../../.data/enquiries.ndjson"), "utf8").trim().split("\n");
  return JSON.parse(lines[lines.length - 1]!);
};

async function enquireFromCampaignLanding(page: import("@playwright/test").Page) {
  await page.goto("/?utm_source=newsletter&utm_campaign=gv-autumn&email=leak@example.com");
  await page.getByRole("link", { name: "Explore developments" }).first().click();
  await page.goto("/enquire?development=terrace-heights");
  await page.locator("#f-firstName").fill("Omar");
  await page.locator("#f-lastName").fill("K");
  await page.locator("#f-email").fill("omar@example.com");
  await page.locator("#f-country").selectOption("AE");
  await page.waitForTimeout(2600);
  await page.getByRole("button", { name: /Send enquiry/ }).click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  return lastDelivered();
}

test.describe("Campaign attribution", () => {
  test("first-touch UTMs survive navigation into the enquiry — with consent", async ({ page }) => {
    await decideConsent(page, true);
    const delivered = await enquireFromCampaignLanding(page);
    expect(delivered.campaignSource).toEqual({ utm_source: "newsletter", utm_campaign: "gv-autumn" });
  });

  test("nothing is recorded without consent", async ({ page }) => {
    await decideConsent(page, false);
    const delivered = await enquireFromCampaignLanding(page);
    expect(delivered.campaignSource).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("limar.campaign.v1"))).toBeNull();
  });
});
