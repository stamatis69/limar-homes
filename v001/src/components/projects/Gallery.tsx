"use client";
import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/routes";
import type { Media } from "@/lib/types";

const ORDER: Media["kind"][] = ["exterior", "interior", "detail", "floorplan", "neighbourhood"];

/**
 * Organised gallery: one tab per media kind actually present. Real Limar photography/renders
 * go in `development.media.gallery`; nothing renders until they exist (no stock substitutes).
 */
export function Gallery({ media, locale, labels }: { media: Media[]; locale: Locale; labels: Record<Media["kind"], string> }) {
  const kinds = ORDER.filter((k) => media.some((m) => m.kind === k));
  const [kind, setKind] = useState(kinds[0]);
  const shown = media.filter((m) => m.kind === kind);
  if (!kinds.length) return null;
  return (
    <div className="stack-4">
      {kinds.length > 1 && (
        <div className="segmented" role="group">
          {kinds.map((k) => (
            <button key={k} type="button" aria-pressed={k === kind} onClick={() => setKind(k)}>
              {labels[k]}
            </button>
          ))}
        </div>
      )}
      <ul className="gallery plain-list">
        {shown.map((m, i) => (
          <li key={`${m.src}-${i}`} className={i === 0 ? "gallery-lead" : undefined}>
            <figure>
              <Image src={m.src} alt={m.alt[locale]} width={m.width} height={m.height} sizes={i === 0 ? "(max-width: 900px) 100vw, 66vw" : "(max-width: 900px) 100vw, 33vw"} unoptimized={m.src.endsWith(".svg")} />
              <figcaption className="label">{m.alt[locale]}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
