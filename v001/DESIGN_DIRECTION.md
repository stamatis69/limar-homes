# Design Direction — v001

## Constraint that shaped everything
No real Limar photography, renders or floorplans could be retrieved into the build environment: the live site and image hosts are blocked, and nothing has been supplied. The brief forbids replacing real buildings with AI-generated ones. So any direction that depends on full-bleed project photography would ship as a grey placeholder box or, worse, as fake buildings.

The chosen direction therefore has to be excellent **without** photography, and has to get better, not break, when real photography arrives.

## Three concepts considered

### A — Mediterranean Modernism ("Stone & Light")
Warm limestone paper, full-bleed sunlit photography, soft serif, lifestyle-first.
- Brand fit: good. Originality: low; it becomes a beige luxury template.
- Without real photography it collapses into empty beige. **Rejected.**

### B — Private Investment House ("The Ledger")
Private-banking restraint, editorial typography, precise numbers, dark and light contrast.
- Credibility: high. Golden Visa clarity: high. Warmth: low; it risks feeling like fintech.
- Architecture is absent, so "I can imagine myself living there" fails. **Not chosen alone.**

### C — Architectural Immersion ("The Model")
Full-screen 3D massing, cinematic camera moves, spatial navigation.
- Requires real geometry, which we don't have. A fake massing model would misrepresent buildings. Mobile and performance cost is heavy. **Rejected.**

### Chosen — **"PLAN & LEDGER"**, a single direction, not an average of the three
**The website is drawn the way an architect draws, and it is annotated the way a private bank reports.**

It is one coherent idea: the architectural *drawing set* (elevation, section, plan, dimension line, title block) is the visual language, and investment information is written into it as the annotations a drawing carries. Photography, once supplied, sits inside the drawing set as another sheet. It does not replace the system.

Why it wins:
- **Honest.** Each development's elevation is generated from its real data (floor count, status, amenities such as a rooftop or pool). It is labelled "schematic" and never presented as a render.
- **Distinctive.** No other Greek developer's site looks like a drawing set with a ledger. It is recognisable without the logo.
- **Functional.** The elevation *is* the availability explorer (building → floor → unit). The drawing does work instead of decorating.
- **Accessible and fast.** It is SVG and semantic HTML, with no WebGL requirement, and it works with reduced motion and on low-end devices.
- **Scales up.** Real photography slots (`heroMedia`, `gallery`) render as "sheets" when present.

## System

### Palette — "Obsidian & Travertine" (revision 2, 2026-09-26; tokens in `src/styles/tokens.css`)
The client asked for a site that feels premium and expensive. Current guidance on luxury real-estate
colour converges on "quiet luxury": a deep near-black anchor, warm ivory neutrals, and one restrained
champagne or brass accent, with no loud hues (sources: luxurypresence.com, "How brand colors impact your
real estate marketing in 2026"; zoviz.com, "Luxury color palette guide 2026"; designworklife.com,
"9 luxury color palettes"). The Plan & Ledger system is kept; its materials are re-cut in that key.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--paper` | #F4EFE7 | Travertine ivory, the reading ground | — |
| `--paper-2` | #E9E1D4 | Honed stone, alternating sheets | — |
| `--white` | #FBF8F3 | Porcelain, data surfaces | — |
| `--ink` | #15171A | Obsidian ink: text, line work, primary buttons | 15.7:1 on paper |
| `--ink-2` | #4F4B45 | Warm graphite: secondary text | 7.6:1 |
| `--ink-3` | #857F75 | Stone: large or decorative text only | 3.5:1 (large text) |
| `--aegean` | #1E3A5C | Availability, focus ring | 10.1:1 |
| `--bronze` | #7A5629 | Accent text on light (kickers, TBC marks) | 5.8:1 |
| `--brass` | #B08D57 | Hairlines, progress rule, ornaments (never text) | — |
| `--night` | #0E1114 | Obsidian: hero, portfolio, capital chapter, footer | — |
| `--on-night` / `-2` | #F2ECE3 / #B3AB9E | Text on obsidian | 16.1:1 / 8.3:1 |
| `--champagne` | #DCC7A1 | Accent and primary buttons on obsidian | 11.5:1 |

Ratios were computed with the WCAG 2.x formula and are enforced by the axe suite (`a11y.spec.ts`).

### Typography (all OFL-1.1, self-hosted, with Greek and Latin Extended subsets)
- **Noto Serif Display**, light 300–450: the architectural voice (headlines and project names). Its high-contrast Greek is excellent, with correct tonos and final sigma.
- **Commissioner**: information (body, UI, navigation). It was designed by Greek type designer Kostas Bartsokas, so Greek is native to it rather than an afterthought.
- **JetBrains Mono**: measurement (unit IDs, m², floors, dimension labels, figures in tables). It has true tabular figures; Commissioner's figures are proportional.
- Coverage was verified for every glyph in `ğĞşŞıİçÇöÖüÜ` and `άέήίόύώΐΰςϊϋΆΈΉΊΌΎΏΪΫ`.
- Greek uppercase: every element sets `lang`, so the browser removes tonos in `text-transform: uppercase`.

### Signature motifs
1. **Dimension line.** Key metrics (m², floors, units, completion) sit on a hairline with end ticks, like a dimensioned drawing.
2. **Title block.** Every development has a drawing title block: sheet number, project, location, status and scale note.
3. **Sheet numbering.** Homepage chapters are numbered like a drawing set (A-01, A-02, …).
4. **Obsidian sheet.** The opening, delivered work, investment and residency chapters and the footer invert to obsidian with champagne line work: the move from PLACE to CAPITAL.
5. **Hairline grid.** A 12-column grid, occasionally made visible as construction lines.

### Depth and motion (revision 2)
**3D massing model** (`src/components/three/`). Concept C was rejected because *invented* geometry
would misrepresent buildings. The model added here invents nothing: it is built only from the same
verified `DrawingSpec` that already drives the 2D elevations (floor count, bays, roof, ground floor,
site features). It is rendered as an architectural white card model, not a photoreal render. Its
caption and accessible name always read "schematic 3D massing from the published floor count, not the
architectural design", and illustrative specs say so. As you scroll, the floors separate into an
exploded axonometric; you can drag to rotate. It is progressive enhancement throughout:
- three.js loads only when the model nears the viewport and the main thread is idle.
- Only hardware-accelerated WebGL gets the model. Software rasterisers keep the drawn elevation
  poster, and three.js is never downloaded.
- Rendering pauses off-screen and in background tabs. Reduced motion gives a still model with no
  turntable.

**Scroll choreography** (`src/lib/client/motion.ts`, `src/styles/experience.css`):
- Lenis smooth wheel scrolling on fine pointers. Touch devices use native scrolling.
- Blocks reveal as they enter the viewport, staggered, and chapter rules draw across.
- Elevations draw their line work when they come into view.
- The home statement "inks in" word by word as it is read.
- A marquee of the real localities drifts with scroll.
- Delivered buildings run horizontally in a pinned section. Keyboard focus scrolls to the focused card.
- The hero copy lifts away while the model explodes.
- Counters run only for figures that start off-screen, and always land on the exact published value.
- Cards tilt in 3D under the pointer.
- The header tone follows the chapter beneath it.

**Safeguards:**
- Nothing is hidden without JavaScript: CSS hides reveal targets only under `@media (scripting: enabled)`, with a 4 s failsafe.
- `prefers-reduced-motion` gives a static, final page.
- All geometry comes from Intersection and Resize observers, and each frame batches reads before writes.
- Everything is covered by `tests/e2e/experience.spec.ts`.

### Anti-generic rules
- No card grids of identical developments. The index is a ledger with rows, a drawing and figures.
- No rounded, shadowed CTA boxes. CTAs are typographic, with a rule line.
- No stock people, handshakes or fake counters.
- Border radius is 0–2px (drawing-sheet precision). Shadows are reserved for lifted surfaces (drawing sheets under tilt, primary buttons on hover).

## Research sources and principles
- Mobbin (web): Calendly and v0 plan comparisons → sticky attribute column, per-column action at top and bottom. H&M filter drawer → "Clear / View (N)" live-count footer.
- Mobbin (iOS): Lovi, Wanderlog and Ulta questionnaires → one question per screen, option rows with a description line, thin top progress bar, back, auto-advance on single choice, and results with "start over". Their playful visual styling was rejected.
- Architectural drawing conventions (title blocks, dimensioning, hatch patterns) as the art-direction source.
- Awwwards, Godly and similar galleries were not reachable from this environment (egress blocked).
