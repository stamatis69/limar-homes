import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import { createHmac } from "node:crypto";
import path from "node:path";

export class DeliveryNotConfigured extends Error {}
export class DeliveryFailed extends Error {}

/**
 * Delivers a validated, CRM-ready enquiry.
 *  - ENQUIRY_WEBHOOK_URL set → POST JSON (HMAC-SHA256 signature in X-Limar-Signature when a secret is set).
 *  - Otherwise, outside production → append to .data/enquiries.ndjson (local outbox for QA).
 *  - Otherwise → DeliveryNotConfigured: the API answers 503 and the UI says so. Never a fake success.
 */
export async function deliver(payload: Record<string, unknown>): Promise<"webhook" | "outbox"> {
  const url = process.env.ENQUIRY_WEBHOOK_URL;
  const body = JSON.stringify(payload);
  if (url) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const secret = process.env.ENQUIRY_WEBHOOK_SECRET;
    if (secret) headers["x-limar-signature"] = createHmac("sha256", secret).update(body).digest("hex");
    const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) }).catch((e: unknown) => {
      throw new DeliveryFailed(e instanceof Error ? e.name : "fetch_failed");
    });
    if (!res.ok) throw new DeliveryFailed(`status_${res.status}`);
    return "webhook";
  }
  if (process.env.LIMAR_DEPLOY_ENV === "production") throw new DeliveryNotConfigured();
  const dir = path.join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "enquiries.ndjson"), body + "\n", "utf8");
  return "outbox";
}
