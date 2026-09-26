# PROJECT STATE — Limar Homes

**Active revision:** `v001` (see `REVISION_INDEX.md`) · **Branch:** `claude/limar-homes-redesign-rbzl6r` · **Updated:** 2026-09-26

## Resume
Say `RESUME PROJECT`. Then:
1. Read this file, `v001/REVISION.md` and `v001/BUSINESS_DATA_CONFLICTS.md`.
2. `cd v001 && npm install && npm run typecheck && npm run lint && npm test && npm run test:e2e`.
3. Continue with **Next actions** below.

## Design memory (durable)
- Direction: **Plan & Ledger**. Architectural drawing set (elevations, title blocks, dimension lines, sheet numbers) combined with private-bank ledger typography.
- Revision 2 (2026-09-26) re-cut it as a premium experience: palette **Obsidian & Travertine** (obsidian #0E1114, travertine #F4EFE7, champagne #DCC7A1, brass hairlines), obsidian chapters, a WebGL schematic massing model, and site-wide scroll choreography. See `v001/DESIGN_DIRECTION.md` for the ratios, sources and safeguards.
- Palette tokens: `v001/src/styles/tokens.css`. Experience layer: `v001/src/styles/experience.css`, `v001/src/lib/client/motion.ts`, `v001/src/components/three/`.
- 3D policy: built only from the verified `DrawingSpec`; always captioned "schematic … not the architectural design"; hardware WebGL only (software GL keeps the drawn poster); the e2e build forces it with `NEXT_PUBLIC_FORCE_WEBGL=1`.
- Type: Noto Serif Display (voice) · Commissioner (text) · JetBrains Mono (measurement). Self-hosted from `v001/public/fonts` with licenses alongside.
- Elevations are generated from data and always labelled schematic or illustrative.

## Evidence ledger

| Item | Status | Evidence |
|---|---|---|
| Canonical data model (developments + units), one source for all surfaces | IMPLEMENTED · TESTED | `src/data/*`; `verify:data` passes |
| Availability explorer (elevation → floor → unit → details/plan → compare/enquire) + semantic table | IMPLEMENTED · BROWSER VERIFIED | screenshots; a11y + comparison specs |
| Persistent comparison tray (IDs only, 4 max, re-resolved live, cross-tab) | IMPLEMENTED · BROWSER VERIFIED | `comparison.spec.ts` (brief §60, steps 1–16) |
| Side-by-side comparison, factual difference tags, mobile one-at-a-time | IMPLEMENTED · BROWSER VERIFIED | `comparison.spec.ts`, `mobile.spec.ts` |
| Golden Visa page + Pathfinder (7 steps, 6 outcome types, reasons/guidance/open questions/matches/next step) | IMPLEMENTED · TESTED · BROWSER VERIFIED | 10 unit tests; `pathfinder.spec.ts` (§61) |
| Contextual enquiry (dev/unit/compare/Pathfinder context), client + server validation, all states, confirmation | IMPLEMENTED · BROWSER VERIFIED | `enquiry.spec.ts` (§62, §63), outbox payload asserted |
| Enquiry security: same-origin check, honeypot, timing, ID resolution, rate limit, body limit, PII-free logs | IMPLEMENTED · TESTED | API assertions in `enquiry.spec.ts` |
| en/el/tr routing, localized segments, hreflang, canonical, lang attr, Greek/Turkish casing | IMPLEMENTED · BROWSER VERIFIED | `seo-i18n.spec.ts`, `mobile.spec.ts` |
| Legacy redirects (/en/*, English segments under /el,/tr, singular slugs), 410, 404 | IMPLEMENTED · TESTED | `seo-i18n.spec.ts` |
| Sitemap (hreflang), robots (prod/preview), JSON-LD (Organization, ApartmentComplex, Breadcrumb, FAQ, Article) without price/rating/geo | IMPLEMENTED · TESTED | `seo-i18n.spec.ts` |
| Security headers (CSP, Referrer, nosniff, frame, Permissions, HSTS in prod) | IMPLEMENTED · VERIFIED (curl) | header check on production build |
| Consent + privacy-aware analytics (dataLayer only with consent, whitelisted props) | IMPLEMENTED · BROWSER VERIFIED | `analytics.spec.ts` |
| Accessibility: axe WCAG 2.2 AA (static + interactive states), keyboard, reduced motion | TESTED · MEASURED | `a11y.spec.ts`; Lighthouse a11y 100 on 9 pages |
| No console errors or hydration mismatches (19 pages, 3 locales) | TESTED | `console.spec.ts` |
| Mobile: no overflow (14 pages), dock priority, touch targets, 16px inputs | TESTED | `mobile.spec.ts` (Pixel 7 emulation) |
| Production guards: fixture refused, dev Site ID suppressed, HSTS, 503 without delivery target | VERIFIED | production build + curl |
| Performance (Lighthouse mobile, production build, sandbox) | MEASURED | table below |
| Premium experience layer: obsidian/travertine palette, smooth scroll, reveals, word-fill, marquee, pinned horizontal portfolio, counters, 3D tilt, header tone | IMPLEMENTED · TESTED · BROWSER VERIFIED | `experience.spec.ts` (6 tests incl. reduced motion + no-JS); desktop/mobile screenshots |
| WebGL schematic massing model (home + development heroes), scroll-exploded floors, drag-rotate, hardware-only, poster fallback | IMPLEMENTED · TESTED | `experience.spec.ts`; poster path browser-verified; 3D on real GPU hardware **not measured in sandbox** |
| Inventory CSV importer (`npm run import:inventory`) | IMPLEMENTED · TESTED | 15 unit tests; `docs/INVENTORY_IMPORT.md` |
| Media intake + `verify:data` media checks (exists, local, alt en/el/tr) | IMPLEMENTED | `docs/MEDIA_INTAKE.md`; brochure download switches on when `brochure` is set |
| Consent-gated first-touch UTM capture (sessionStorage) | IMPLEMENTED · TESTED | `analytics.spec.ts` |
| Real unit schedule, photography, floorplans, brochures, logo | **BLOCKED** | not retrievable / not supplied |
| Golden Visa legal accuracy vs official sources | **ASSUMED** from published legal commentary | official sites blocked; counsel review required |
| Greek/Turkish legal passages reviewed by a professional translator | **BLOCKED** | written by the model; review required |
| Legacy URL crawl | **BLOCKED** | live site unreachable; `SEO_ROUTE_MAP.md` lists inferred slugs |

### Lighthouse (mobile emulation, production build, canonical data, local sandbox; indicative) — revision 2, 2026-09-26
The sandbox has no GPU, so these figures measure the drawn-poster path. The 3D path runs only on hardware WebGL and must be measured on real devices (WebPageTest / CrUX) before launch.

| Page | Perf | A11y | Best pr. | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| / | 88 | 100 | 100 | 3.5 s | 0 | 170 ms |
| /projects | 91 | 100 | 100 | 3.3 s | 0 | 130 ms |
| /projects/terrace-heights | 90 | 100 | 100 | 3.5 s | 0 | 110 ms |
| /golden-visa | 93 | 100 | 100 | 3.2 s | 0 | 50 ms |
| /golden-visa/pathfinder | 94 | 100 | 100 | 3.0 s | 0 | 50 ms |
| /el | 86 | 100 | 100 | 3.7 s | 0 | 190 ms |
| /el/erga | 88 | 100 | 100 | 3.5 s | 0 | 160 ms |
| /tr/projeler/terrace-heights | 88 | 100 | 100 | 3.6 s | 0 | 100 ms |

Run-to-run variance is about ±3 points (a production-mode rerun gave / 87, /projects/terrace-heights 91, /el 84, with SEO 100 on all three). For comparison, revision 1 scored 89–98 on the same pages. SEO scores 100 only on `LIMAR_DEPLOY_ENV=production` builds; preview builds are `noindex` by design.

## Next actions (in priority order)
1. **Limar inputs (blocking launch):** the unit schedule export for Terrace Heights (import with `npm run import:inventory -- export.csv`); photography and renders; floorplans; the brochure PDF; the logo; the WhatsApp number; confirmed office address and phone; resolution of the 22 rows in `v001/BUSINESS_DATA_CONFLICTS.md`.
2. **Legal:** counsel reviews the Golden Visa copy (en/el/tr) and `src/lib/pathfinder.ts` against the Ministry of Migration sources and Circular 1/2026; counsel confirms the qualifying route for each Terrace Heights residence; the privacy notice placeholders are completed and the live site's policy is reconciled.
3. **SEO cutover:** crawl the live site, finish `v001/SEO_ROUTE_MAP.md`, and migrate the full text of the two legacy articles (currently summaries).
4. **Deployment:** set `ENQUIRY_WEBHOOK_URL` and `ENQUIRY_WEBHOOK_SECRET`; move the rate limiter to a shared store on serverless hosting; set `NEXT_PUBLIC_SITE_URL`; pass `npm run verify:production`.
5. **Merqon:** allocate a production `MERQON_SITE_ID` and build the central verification endpoint. Cryptographic signing is not implemented, so no signature is claimed.
6. **Real-device performance:** measure the 3D heroes on mid-range Android and iPhone hardware (WebPageTest), and tune `massing-scene.ts` (shadow map size, pixel ratio) if INP or TBT regress.
7. **Optional:** connect an analytics provider to `window.dataLayer` behind the existing consent gate; add a Google rating via the Business Profile API (`site.reviews`).
