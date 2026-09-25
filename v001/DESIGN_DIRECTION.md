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

### Palette (tokens in `src/styles/tokens.css`)
| Token | Hex | Role |
|---|---|---|
| `--paper` | #F1ECE3 | Limestone paper, the default ground |
| `--paper-2` | #E7E0D4 | Travertine, for alternating sheets |
| `--white` | #FBFAF7 | Architectural white, for data surfaces |
| `--ink` | #1B1A18 | Deep charcoal, for text and line work |
| `--ink-2` | #57534C | Secondary text (AA on paper) |
| `--aegean` | #1E3A5C | Mediterranean deep blue: "available", links, primary action |
| `--bronze` | #8A6538 | Muted bronze: under offer, figures, accents |
| `--olive` | #5B6647 | Subtle earth: Golden Visa context |
| `--night` | #14202E | Deep-blue "night sheet" for the investment chapters |

State colours are restrained and architectural, never neon:
- Available: Aegean, solid.
- Under offer: bronze, hatched.
- Reserved: ink-2, dotted.
- Sold: ink at 18%, crossed.

State is never conveyed by colour alone; every state also has a text label and a pattern.

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
4. **Night sheet.** The investment and residency chapters invert to deep Aegean night, the move from PLACE to CAPITAL.
5. **Hairline grid.** A 12-column grid, occasionally made visible as construction lines.

### Motion
Line-drawing reveals (SVG stroke) on elevation entry, floor highlight on hover or focus, and a subtle count in the comparison tray. No scroll-jacking. All of it is disabled under `prefers-reduced-motion`.

### Anti-generic rules
- No card grids of identical developments. The index is a ledger with rows, a drawing and figures.
- No rounded, shadowed CTA boxes. CTAs are typographic, with a rule line.
- No stock people, handshakes or fake counters.
- Border radius is 0–2px (drawing-sheet precision), and there are no drop shadows except on overlays.

## Research sources and principles
- Mobbin (web): Calendly and v0 plan comparisons → sticky attribute column, per-column action at top and bottom. H&M filter drawer → "Clear / View (N)" live-count footer.
- Mobbin (iOS): Lovi, Wanderlog and Ulta questionnaires → one question per screen, option rows with a description line, thin top progress bar, back, auto-advance on single choice, and results with "start over". Their playful visual styling was rejected.
- Architectural drawing conventions (title blocks, dimensioning, hatch patterns) as the art-direction source.
- Awwwards, Godly and similar galleries were not reachable from this environment (egress blocked).
