# Adding Limar's photography, renders, floorplans and brochures

Nothing visual is invented. Every media slot is empty until Limar supplies a file, and each slot
renders automatically once it is filled.

## 1. Put the files in `public/media/`
```
public/media/<development-id>/hero.jpg
public/media/<development-id>/gallery-01.jpg …
public/media/<development-id>/brochure.pdf
public/media/<development-id>/plans/<unit-label>.svg | .pdf | .png
```
- **Photography and renders:** JPEG/WebP, at least 2400 px on the long edge. `next/image` makes the responsive AVIF/WebP sizes.
- **Floorplans:** SVG preferred, otherwise a PDF or a high-resolution PNG.
- **Never hotlink.** `verify:data` rejects `http(s)://` media.

## 2. Record the licence
Add one row per file to `ASSET_SOURCES.md`: source, creator, licence, and permission for commercial
use. **A file with an unknown licence is not shipped.**

## 3. Reference the files in `src/data/developments.ts`
```ts
media: {
  hero: { src: "/media/terrace-heights/hero.jpg", width: 2400, height: 1600, kind: "exterior",
          alt: { en: "…", el: "…", tr: "…" } },
  gallery: [ /* same shape; kind: exterior | interior | detail | floorplan | neighbourhood */ ],
},
brochure: { href: "/media/terrace-heights/brochure.pdf" },
```
Renders must be described as renders in the alt text and captions (for example, "Rooftop terrace, render").

## 4. Floorplans per unit
Add a `floorplan` column to the inventory CSV (see `INVENTORY_IMPORT.md`). The importer checks that each file exists.

## 5. Verify
`npm run verify:data` fails on:
- a missing file,
- a remote URL,
- a non-absolute path,
- missing alt text in any of en/el/tr.

## What changes on the site
- **Development hero:** the photograph replaces the 3D massing model.
- **Architecture section:** the gallery replaces the "images pending" slot.
- **Brochure:** requests switch from "request by enquiry" to a direct download (when `brochure` is set).
- **Explorer:** the unit detail shows its floorplan.
