# Limar Homes — v001

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · plain CSS design tokens. Nothing loads from a third-party runtime.

## Run

```bash
npm install
npm run dev                          # http://localhost:3000, canonical (real) data
LIMAR_INVENTORY=fixture npm run dev  # labelled demonstration inventory for QA
```

## Checks

```bash
npm run typecheck && npm run lint
npm test                    # unit tests (Pathfinder logic)
npm run test:e2e            # Playwright acceptance suite (builds with the QA fixture on :3100)
npm run verify:data         # canonical data integrity
npm run verify:production   # launch gate: fails on fixture data / missing enquiry delivery target
```

Playwright uses the Chromium at `/opt/pw-browsers/chromium`. Override it with `PW_CHROMIUM=/path/to/chrome`.

## Environment (see `.env.example`)

| Variable | Purpose |
|---|---|
| `LIMAR_DEPLOY_ENV=production` | Turns on production guards: fixture builds are refused, HSTS is sent, robots allows indexing, the dev enquiry outbox is disabled, and the dev Merqon Site ID is suppressed |
| `LIMAR_INVENTORY` | `canonical` (default) or `fixture` (QA only) |
| `NEXT_PUBLIC_SITE_URL` | Origin for canonical, hreflang, sitemap and OG URLs |
| `ENQUIRY_WEBHOOK_URL` / `ENQUIRY_WEBHOOK_SECRET` | Server-only CRM/automation endpoint. Payloads are signed with HMAC-SHA256 in `X-Limar-Signature` |
| `ENQUIRY_RATE_LIMIT` | Enquiries per client per 10 minutes (default 5) |
| `MERQON_SITE_ID` | Registry-allocated `MQ-YYYY-NNNN`. Without it, provenance is disabled in production |

## Where things live

| Concern | File |
|---|---|
| Development facts (single source of truth) | `src/data/developments.ts` |
| Unit inventory | `src/data/inventory/canonical.ts` (real) · `fixture.ts` (QA) |
| Everything reads through | `src/data/catalog.ts` |
| Routes and localized URL segments | `src/lib/i18n/routes.ts` + `src/proxy.ts` |
| Copy (en/el/tr) | `src/lib/i18n/dictionaries/*.ts` (el/tr must satisfy the en type) |
| Pathfinder rules | `src/lib/pathfinder.ts` (+ `tests/unit/pathfinder.test.ts`) |
| Enquiry validation (client and server) | `src/lib/enquiry/validation.ts` |
| Enquiry API / delivery | `src/app/api/enquiry/route.ts`, `src/lib/enquiry/deliver.ts` |
| Comparison state | `src/lib/client/compare-store.ts` (IDs only, re-resolved via `/api/units`) |
| Merqon signature | `src/lib/merqon.ts` |

## Adding the real unit schedule
Export units from Limar's sales system into `canonicalInventory.units` (shape: `Unit` in `src/lib/types.ts`), set `asOf`, and run `npm run verify:data`. The explorer, comparison, Pathfinder matches, enquiry validation and home "current opportunity" all update from that one list. Leave `price: null` unless Limar publishes a current price.
