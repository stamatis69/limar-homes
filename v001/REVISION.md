# REVISION v001 — ACTIVE

- **Parent:** v000, the live site at limarhomes.com. It is external: its source is not in this repository, and it was unreachable from the build environment.
- **Created:** 2026-09-25 on branch `claude/limar-homes-redesign-rbzl6r`
- **Scope:** a complete rebuild covering design system, data model, buyer flows, multilingual routing, SEO migration, security and tests.

## Decisions
1. **Stack:** Next.js 16 App Router, TypeScript and plain CSS tokens. There was no prior code to preserve. Tailwind and shadcn were avoided on purpose so the site does not inherit their visual defaults.
2. **Design direction:** "Plan & Ledger" (see `DESIGN_DIRECTION.md`). Chosen partly because no real photography was available and the brief forbids fake buildings.
3. **Typography:** Noto Serif Display, Commissioner and JetBrains Mono, self-hosted as OFL subsets. Greek and Turkish coverage was verified glyph by glyph and in rendered specimens.
4. **Data honesty:** development facts are single-sourced, with `unverified` field lists. No prices, no coordinates and no invented unit schedule. A QA fixture exists, is labelled, and the production build refuses it.
5. **Golden Visa:** the tier rules of Law 5100/2024 are encoded in `src/lib/pathfinder.ts`. Limar's "Golden Visa eligible" statement is shown as Limar's statement, and the route is confirmed per residence by counsel.
6. **Routing:** English stays at the root, preserving indexed URLs. `/el` and `/tr` use localized segments. Legacy singular slugs get a 301 and `/nyt-vote` returns 410.
7. **Enquiries:** one validator is shared by client and server. The server resolves all property context itself. Delivery goes to a signed webhook. Production with no delivery target returns 503 and never shows a fake success.
8. **Merqon signature:** centralized in `src/lib/merqon.ts`. The visible credit is "Designed & developed by Merqon Group". The machine layer is on in development (`MQ-DEV-PENDING`) and switched **off in production** until a real Site ID exists.

## Evidence
See `PROJECT_STATE.md` at the repository root for the evidence ledger and measurements.
