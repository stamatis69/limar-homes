# SEO Route Map — v000 (live) → v001

**Crawl status:** a full crawl of the live site was not possible because the build environment's network policy blocks `limarhomes.com`. The URLs marked **INDEXED** below were confirmed through search-engine results on 2026-09-25. URLs marked **INFERRED** follow the confirmed `/projects/{slug}` pattern and must be checked with a crawl (for example `screaming-frog` or `curl` against the sitemap) before DNS cutover. Any additional URL the crawl finds must be added here, with a redirect if needed, before launch.

Principles:
- English stays at the root with no prefix, which preserves every indexed English URL unchanged.
- Greek lives under `/el/…` and Turkish under `/tr/…`, with localized path segments.
- Nothing is redirected to the homepage by default.
- Redirects live in one place: `src/lib/i18n/routes.ts` → `legacyRedirects`, consumed by `next.config.ts`.

| OLD URL | NEW URL | LANGUAGE | ACTION | EVIDENCE |
|---|---|---|---|---|
| `/` | `/` | en | PRESERVE | INDEXED |
| `/projects` | `/projects` | en | PRESERVE | INDEXED |
| `/projects/aura-residences` | `/projects/aura-residences` | en | PRESERVE | INDEXED |
| `/projects/terrace-heights` | `/projects/terrace-heights` | en | PRESERVE | INFERRED |
| `/projects/parkview-residences` | `/projects/parkview-residences` | en | PRESERVE | INFERRED |
| `/projects/parkview-residence` | `/projects/parkview-residences` | en | 301 REDIRECT | INFERRED (press uses singular "Parkview Residence") |
| `/projects/portside-residences` | `/projects/portside-residences` | en | PRESERVE | INFERRED |
| `/projects/portside-residence` | `/projects/portside-residences` | en | 301 REDIRECT | INFERRED (press uses singular) |
| `/projects/la-riviera` | `/projects/la-riviera` | en | PRESERVE | INFERRED |
| `/about` | `/about` | en | PRESERVE | INDEXED |
| `/contact` | `/contact` | en | PRESERVE | INDEXED |
| `/news` | `/news` | en | PRESERVE (label changes to "Insights") | INDEXED |
| `/news/terrace-heights-wins-luxury-lifestyle-awards-2026-for-best-luxury-apartment-living-in-greece` | same | en | PRESERVE | INDEXED |
| `/news/limar-homes-2025-review-a-visionary-year-in-property` | same | en | PRESERVE | INDEXED |
| `/privacy-policy` | `/privacy-policy` | en | PRESERVE | INDEXED |
| `/nyt-vote` | — | en | REMOVE INTENTIONALLY (serves 410 Gone) | INDEXED. It is a time-limited voting-contest page with no v001 equivalent. Confirm with Limar before launch; if the campaign is still live, restore it. |
| `/golden-visa` | `/golden-visa` | en | NEW (if the live site had a Golden Visa URL, add a 301 here after the crawl) | — |
| — | `/golden-visa/pathfinder` | en | NEW | — |
| — | `/compare` | en | NEW (noindex) | — |
| — | `/enquire` | en | NEW (noindex) | — |
| — | `/el`, `/el/erga`, `/el/erga/{slug}`, `/el/golden-visa`, `/el/golden-visa/odigos`, `/el/etaireia`, `/el/epikoinonia`, `/el/nea`, `/el/nea/{slug}`, `/el/aporrito`, `/el/sygkrisi`, `/el/aitima` | el | NEW | The legacy Greek URL scheme is unknown. If one existed, map it here. |
| — | `/tr`, `/tr/projeler`, `/tr/projeler/{slug}`, `/tr/golden-visa`, `/tr/golden-visa/rehber`, `/tr/hakkimizda`, `/tr/iletisim`, `/tr/haberler`, `/tr/haberler/{slug}`, `/tr/gizlilik`, `/tr/karsilastir`, `/tr/talep` | tr | NEW | Same as above |
| `/en`, `/en/*` | `/` + rest | en | 301 REDIRECT | Canonicalises any `/en` prefix |
| `/el/projects/*`, `/tr/projects/*` (and other English segments under a locale) | the localized segment | el/tr | 301 REDIRECT | Handled in `src/proxy.ts` |

## Launch checklist (BLOCKED until the live crawl is done)
1. Crawl the live sitemap and every internal link; export the URL list.
2. Diff it against this table; add any missing URL with PRESERVE or 301.
3. Confirm the four INFERRED project slugs.
4. After cutover, submit `/sitemap.xml` in Search Console and watch 404s for 30 days.
