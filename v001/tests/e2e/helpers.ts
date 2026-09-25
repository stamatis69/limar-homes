import { expect, type Page } from "@playwright/test";

/** Record a consent decision up front so the consent dock does not cover content (consent has its own tests). */
export async function decideConsent(page: Page, analytics = false) {
  await page.addInitScript((a) => {
    try {
      localStorage.setItem("limar.consent.v1", JSON.stringify({ analytics: a }));
    } catch {}
  }, analytics);
}

export async function addToCompare(page: Page, unitId: string) {
  const btn = page.locator(`[data-compare="${unitId}"]`);
  const showAll = page.getByRole("button", { name: /^Show all \d+ residences$/ });
  if ((await btn.count()) === 0 && (await showAll.count()) > 0) await showAll.click();
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
}

export const tray = (page: Page) => page.locator("section.tray");

export async function pickOption(page: Page, text: string) {
  const exact = new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  await page.locator("label.pf-option").filter({ has: page.locator(".t", { hasText: exact }) }).click();
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
