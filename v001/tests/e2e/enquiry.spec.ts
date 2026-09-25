import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { addToCompare, decideConsent, tray } from "./helpers";

const OUTBOX = path.join(__dirname, "../../.data/enquiries.ndjson");
const lastDelivered = () => {
  const lines = readFileSync(OUTBOX, "utf8").trim().split("\n");
  return JSON.parse(lines[lines.length - 1]!);
};

async function fillValid(page: Page) {
  await page.locator("#f-firstName").fill("Nadia");
  await page.locator("#f-lastName").fill("Haddad");
  await page.locator("#f-email").fill("nadia@example.com");
  await page.locator("#f-country").selectOption("LB");
}

test.describe("Property enquiry (brief §62)", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("unit context is prefilled, validation is accessible, success only after server acceptance", async ({ page }) => {
    // 1–3. development → select unit → start enquiry
    await page.goto("/projects/terrace-heights");
    const row = page.locator("li.unit-row", { hasText: "B102" });
    await row.getByRole("link", { name: /Enquire/ }).click();
    await expect(page).toHaveURL(/\/enquire\?development=terrace-heights&unit=terrace-heights%3AB102/);
    // 4–5. development + unit prefilled from canonical data
    const card = page.locator(".context-card");
    await expect(card).toContainText("Terrace Heights");
    await expect(card.getByTestId("ctx-unit")).toContainText("B102");
    await expect(card.getByTestId("ctx-unit")).toContainText("Available");
    // no errors before interaction
    await expect(page.locator(".field-error")).toHaveCount(0);

    // 6–7. invalid submission → summary focused, fields marked invalid, values kept
    await page.locator("#f-email").fill("not-an-email");
    await page.locator("#f-firstName").fill("Nadia");
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    const summary = page.locator(".error-summary");
    await expect(summary).toBeFocused();
    await expect(summary).toContainText("Email: Enter an email address like name@example.com.");
    await expect(page.locator("#f-email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#f-email")).toHaveAttribute("aria-describedby", /e-email/);
    await expect(page.locator("#f-firstName")).toHaveValue("Nadia");
    // choosing WhatsApp makes phone required
    await page.getByRole("radio", { name: "WhatsApp" }).check();
    await expect(page.locator("#e-phone")).toContainText("Add a phone number");

    // 8. correct values (errors clear live after first submit)
    await fillValid(page);
    await page.locator("#f-phone").fill("+961 3 123 456");
    await expect(page.locator(".field-error")).toHaveCount(0);

    // 9–12. submit; visible submitting state; success only after the server's 201
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/enquiry", async (route) => {
      await held;
      await route.continue();
    });
    await page.waitForTimeout(2600); // below 2.5 s the server treats submissions as bots
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    await expect(page.getByRole("button", { name: /Sending/ })).toBeDisabled();
    await expect(page.getByTestId("confirmation")).toHaveCount(0);
    const responsePromise = page.waitForResponse("**/api/enquiry");
    release();
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // 13. confirmation proves the correct development and unit were received
    const confirm = page.getByTestId("confirmation");
    await expect(confirm).toBeVisible();
    await expect(confirm.getByRole("heading", { name: "Request received" })).toBeFocused();
    await expect(confirm.getByTestId("confirm-dev")).toHaveText("Terrace Heights");
    await expect(confirm.getByTestId("confirm-unit")).toContainText("B102");
    await expect(confirm).toContainText("WhatsApp");
    const ref = (await confirm.getByTestId("confirm-ref").textContent())!;
    expect(ref).toMatch(/^LMR-\d{6}-[0-9A-F]{6}$/);
    const delivered = lastDelivered();
    expect(delivered.reference).toBe(ref);
    expect(delivered).toMatchObject({ developmentId: "terrace-heights", unitId: "terrace-heights:B102", unitStatus: "available", preferredContactMethod: "whatsapp", language: "en" });
    expect(delivered.sourcePage).toContain("/projects/terrace-heights");
  });

  test("failure states keep values and recover through retry (14)", async ({ page }) => {
    await page.goto("/enquire?development=terrace-heights&source=test");
    await fillValid(page);
    await page.waitForTimeout(2600);
    let attempt = 0;
    await page.route("**/api/enquiry", async (route) => {
      attempt++;
      if (attempt === 1) return route.abort("internetdisconnected");
      if (attempt === 2) return route.fulfill({ status: 500, json: { error: "server" } });
      return route.continue();
    });
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    await expect(page.locator(".status-banner")).toContainText("couldn't reach our server");
    await expect(page.locator(".status-banner")).toBeFocused();
    await expect(page.locator("#f-email")).toHaveValue("nadia@example.com");
    await page.locator(".status-banner").getByRole("button", { name: "Try again" }).click();
    await expect(page.locator(".status-banner")).toContainText("Something went wrong on our side");
    await page.locator(".status-banner").getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("confirmation")).toBeVisible();
    await expect(page.getByTestId("confirm-dev")).toHaveText("Terrace Heights");
  });

  test("rate limiting is shown as its own state", async ({ page }) => {
    await page.goto("/enquire");
    await fillValid(page);
    await page.waitForTimeout(2600);
    await page.route("**/api/enquiry", (route) => route.fulfill({ status: 429, json: { error: "rate_limited" } }));
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    await expect(page.locator(".status-banner")).toContainText("Too many enquiries");
  });
});

test.describe("Comparison → enquiry (brief §63)", () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  test("primary unit and compared units travel together into CRM metadata", async ({ page }) => {
    await page.goto("/projects/terrace-heights");
    await addToCompare(page, "terrace-heights:B102");
    await addToCompare(page, "terrace-heights:D104");
    await page.goto("/projects/fixture-stress-test-residences");
    await addToCompare(page, "fixture-stress:1.01");
    await tray(page).getByRole("link", { name: /Compare/ }).click();
    const table = page.locator(".compare-desktop table");
    // choose the primary interest
    await table.locator("th", { hasText: "D104" }).getByLabel("Primary interest").check();
    await page.getByRole("link", { name: "Enquire about my shortlist" }).click();
    const card = page.locator(".context-card");
    await expect(card.getByTestId("ctx-unit")).toContainText("D104");
    await expect(card).toContainText("Also considered");
    await expect(card).toContainText("B102");
    await expect(card).toContainText("1.01");
    await fillValid(page);
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: /Send enquiry/ }).click();
    await expect(page.getByTestId("confirm-unit")).toContainText("D104");
    await expect(page.getByTestId("confirm-also")).toContainText("B102");
    const delivered = lastDelivered();
    expect(delivered.unitId).toBe("terrace-heights:D104");
    expect(delivered.comparedUnitIds.sort()).toEqual(["fixture-stress:1.01", "terrace-heights:B102"]);
    expect(delivered.source).toBe("compare");
    // "Continue comparing" is offered because the shortlist still exists
    await expect(page.getByRole("link", { name: "Continue comparing" })).toBeVisible();
  });
});

test.describe("Enquiry API is authoritative", () => {
  const valid = (over: Record<string, unknown> = {}) => ({
    interest: "purchase", firstName: "A", lastName: "B", email: "a@example.com", phone: "", country: "GR", language: "en",
    contactMethod: "email", budget: "", goldenVisaInterest: false, message: "", marketingConsent: false, website: "",
    startedAt: Date.now() - 10_000,
    context: { developmentId: "terrace-heights", unitId: null, comparedUnitIds: [], sourcePage: "/", source: "test", campaign: null, pathfinder: null },
    ...over,
  });

  test("rejects cross-origin, bots, bad IDs and malformed fields; rate-limits", async ({ request, baseURL }) => {
    const origin = { origin: baseURL!, "content-type": "application/json" };
    expect((await request.post("/api/enquiry", { data: valid(), headers: { origin: "https://evil.example", "content-type": "application/json" } })).status()).toBe(403);
    expect((await request.post("/api/enquiry", { data: valid({ website: "http://spam" }), headers: origin })).status()).toBe(400);
    expect((await request.post("/api/enquiry", { data: valid({ startedAt: Date.now() }), headers: origin })).status()).toBe(400);
    const badUnit = await request.post("/api/enquiry", { data: valid({ context: { ...valid().context, unitId: "terrace-heights:Z999" } }), headers: origin });
    expect(badUnit.status()).toBe(422);
    expect((await badUnit.json()).errors).toEqual({ unit: "invalid" });
    const badFields = await request.post("/api/enquiry", { data: valid({ email: "x", country: "ZZ", contactMethod: "phone" }), headers: origin });
    expect(await badFields.json()).toMatchObject({ errors: { email: "email", country: "invalid", phone: "phoneRequired" } });
    // separate client key so other tests are unaffected
    const ipHeaders = { ...origin, "x-forwarded-for": "203.0.113.77" };
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await request.post("/api/enquiry", { data: valid({ email: "bad" }), headers: ipHeaders })).status());
    expect(statuses.slice(0, 20).every((s) => s === 422)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});
