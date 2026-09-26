"use client";
import Link from "next/link";
import { setUrlParams, useUrlParams } from "@/lib/client/url-params";
import { Elevation } from "@/components/Elevation";
import { StateMark } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { fill, formatRange, loc } from "@/lib/format";
import type { Development } from "@/lib/types";

export interface IndexEntry {
  dev: Development;
  available: number | null;
}

type Dict = Pick<Dictionary, "projects" | "common" | "status">;

/**
 * Filters live in the URL (?status=&region=) so results are shareable. The server renders the full,
 * unfiltered list (static HTML, no layout shift); URL filters apply after hydration.
 */
export function DevelopmentIndex({ locale, entries, dict }: { locale: Locale; entries: IndexEntry[]; dict: Dict }) {
  const params = useUrlParams();
  const status = params.get("status") ?? "all";
  const region = params.get("region") ?? "all";

  const regions = [...new Set(entries.map((e) => e.dev.region))];
  const statuses = [...new Set(entries.map((e) => e.dev.status))];

  const set = (key: string, value: string) => setUrlParams({ [key]: value });

  const shown = entries.filter((e) => (status === "all" || e.dev.status === status) && (region === "all" || e.dev.region === region));

  const availabilityText = (e: IndexEntry) =>
    e.dev.status === "sold-out" ? dict.projects.soldOut : e.available == null ? dict.projects.availabilityPending : fill(dict.projects.availabilityCount, { count: e.available });

  return (
    <div>
      <form className="filters" aria-label={dict.projects.filterLabel} onSubmit={(e) => e.preventDefault()}>
        {statuses.length > 1 && (
          <fieldset>
            <legend className="label" style={{ minWidth: 90 }}>{dict.common.status}</legend>
            {[
              ["all", dict.projects.filterAll],
              ["selling", dict.projects.filterSelling],
              ["sold-out", dict.projects.filterSold],
            ].map(([v, label]) => (
              <label className="chip" key={v}>
                <input type="radio" name="status" value={v} checked={status === v} onChange={() => set("status", v!)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        )}
        {regions.length > 1 && (
          <fieldset>
            <legend className="label" style={{ minWidth: 90 }}>{dict.common.location}</legend>
            {[
              ["all", dict.projects.filterAll],
              ["attica", dict.projects.filterAttica],
              ["corinthia", dict.projects.filterCorinthia],
            ].map(([v, label]) => (
              <label className="chip" key={v}>
                <input type="radio" name="region" value={v} checked={region === v} onChange={() => set("region", v!)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        )}
        <p className="results-count" role="status" aria-live="polite">
          {fill(dict.projects.results, { count: shown.length })}
        </p>
      </form>

      {shown.length === 0 ? (
        <div className="pending-slot" style={{ marginTop: "var(--s-6)" }}>
          <p>{dict.projects.empty}</p>
          <button type="button" className="btn btn--small" onClick={() => setUrlParams({ status: null, region: null })}>
            {dict.projects.clear}
          </button>
        </div>
      ) : (
        <div className="dev-index">
          {shown.map((e) => {
            const d = e.dev;
            const url = href(locale, `/projects/${d.slug}`);
            return (
              <article key={d.id} className={`dev-entry${d.status === "sold-out" ? " dev-entry--sold" : ""}`} aria-labelledby={`dev-${d.id}`}>
                <div className="dev-entry-drawing">
                  <Elevation spec={d.drawing} title={`${d.name} — ${dict.common.schematic}`} caption={`${dict.common.sheet} ${d.sheet} · ${d.drawing.illustrative ? dict.common.illustrative : dict.common.schematic}`} animate={false} />
                </div>
                <div className="dev-entry-copy">
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="sheet-no">{d.sheet}</span>
                    <StateMark status={d.status} label={dict.status[d.status]} />
                  </div>
                  <h2 className="h1" id={`dev-${d.id}`}>
                    <Link href={url}>{d.name}</Link>
                  </h2>
                  <p className="muted">{loc(d.copy.tagline, locale)}</p>
                  <dl className="facts">
                    <dt className="label">{dict.projects.colLocation}</dt>
                    <dd>{loc(d.locality, locale)}, {loc(d.city, locale)}</dd>
                    <dt className="label">{dict.projects.colSize}</dt>
                    <dd className="num">{formatRange(d.sizeMin, d.sizeMax, locale)}{d.unverified.includes("sizeRange") || d.unverified.includes("sizeMax") ? <span className="tbc"> *</span> : null}</dd>
                    <dt className="label">{dict.projects.colBedrooms}</dt>
                    <dd className="num">{d.bedroomsMin}–{d.bedroomsMax}</dd>
                    <dt className="label">{dict.projects.colCompletion}</dt>
                    <dd>{loc(d.completion.label, locale)}</dd>
                    <dt className="label">{dict.projects.colAvailability}</dt>
                    <dd>{availabilityText(e)}</dd>
                  </dl>
                  <div className="cta-row">
                    <Link className={`btn${d.status === "selling" ? " btn--primary" : ""}`} href={url}>
                      {dict.common.viewDevelopment} <span className="arrow">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
