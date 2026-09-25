import "server-only";

/**
 * Sliding-window limiter, per client key. In-memory: correct for a single instance.
 * On multi-instance/serverless hosting, back this with a shared store (e.g. Redis/KV);
 * recorded as a deployment item in PROJECT_STATE.md.
 */
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = Number(process.env.ENQUIRY_RATE_LIMIT ?? 5);
const hits = new Map<string, number[]>();

export function rateLimit(key: string, now = Date.now()): { ok: boolean; retryAfter: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return { ok: true, retryAfter: 0 };
}
