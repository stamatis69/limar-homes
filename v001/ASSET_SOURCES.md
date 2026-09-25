# Asset Sources — v001

Rule: an asset with an unknown license is not shipped. Retrieval date for every row: 2026-09-25.

| Filename | Source | Creator | License | Attribution | Commercial use | Modification | Usage location | Approval status |
|---|---|---|---|---|---|---|---|---|
| `public/fonts/noto-serif-display-{latin,greek}-wght-normal.woff2` | npm `@fontsource-variable/noto-serif-display@5.3.0` | Google / Noto project | SIL OFL 1.1 (`public/fonts/licenses/noto-serif-display-OFL.txt`) | Not required; license shipped | Yes | None | Display typography (all locales) | Approved (OFL) |
| `public/fonts/noto-serif-display-latin-ext-wght-normal.woff2` | same | same | SIL OFL 1.1 | as above | Yes | **Subset** with fontTools `pyftsubset` to Turkish-specific glyphs (Ğğ İı Şş) and a few macron letters. The `wght` axis is kept. 174 KB → 6.4 KB. OFL permits modification; the font is not renamed because the Reserved Font Name clause does not apply to Noto. | Turkish display text | Approved (OFL) |
| `public/fonts/commissioner-{latin,latin-ext,greek}-wght-normal.woff2` | npm `@fontsource-variable/commissioner@5.3.0` | Kostas Bartsokas | SIL OFL 1.1 (`licenses/commissioner-OFL.txt`) | Not required | Yes | None | Body, UI | Approved (OFL) |
| `public/fonts/jetbrains-mono-{latin,latin-ext,greek}-wght-normal.woff2` | npm `@fontsource-variable/jetbrains-mono@5.3.0` | JetBrains | SIL OFL 1.1 (`licenses/jetbrains-mono-OFL.txt`) | Not required | Yes | None | Measurements, unit IDs, labels | Approved (OFL) |
| Schematic elevations (inline SVG) | Generated at render time by `src/components/Elevation.tsx` from canonical data | Original to this project | Project code | — | Yes | — | Home, index, development pages | Approved. Labelled "schematic / illustrative, not to scale" |
| `src/app/icon.svg` | Original | This project | Project asset | — | Yes | — | Favicon | Approved |
| `/opengraph-image` (generated PNG) | `src/app/[locale]/opengraph-image.tsx` (next/og) | This project | Project asset | — | Yes | — | Social sharing | Approved |
| `public/fixtures/sample-plan.svg` | Original, labelled "QA fixture, not a real layout" | This project | Project asset | — | n/a | — | Fixture mode only | Test-only; never shipped as real data |
| `public/fixtures/gallery-sample.png` | Rendered from the project's own OG image route | This project | Project asset | — | n/a | — | Fixture mode only | Test-only |

## Not used, and why
- **Limar photography, renders, floorplans, brochures and logo.** These were not retrievable: the live site is blocked by the environment's network policy, and no files were supplied. **BLOCKED.** Media slots exist (`development.media.hero`, `.gallery`, `unit.floorplan`, `development.brochure`) and render automatically once files are added. The wordmark is typographic until the official logo file is supplied.
- **Stock or AI imagery of buildings or people.** Deliberately not used (brief §45: no fake buildings, no generic people).
- **Map tiles / Google Maps embed.** No verified coordinates, and a third-party embed would need CSP and consent changes. Maps open an address search in a new tab instead.
- **Merqon library assets (`G:\Merqon Group Database`).** That drive does not exist in this Linux build environment. None were used.
