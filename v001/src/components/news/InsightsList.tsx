"use client";
import Link from "next/link";
import { setUrlParams, useUrlParams } from "@/lib/client/url-params";

export interface InsightItem {
  slug: string;
  href: string;
  category: string;
  categoryLabel: string;
  dateLabel: string;
  title: string;
  summary: string;
  readingTime: string;
}

/** Category filter (?category=) over a statically rendered list; the server HTML shows every article. */
export function InsightsList({ items, categories, labels }: { items: InsightItem[]; categories: Array<{ key: string; label: string }>; labels: { filter: string; empty: string; read: string } }) {
  const params = useUrlParams();
  const requested = params.get("category") ?? "all";
  const active = categories.some((c) => c.key === requested) ? requested : "all";
  const shown = active === "all" ? items : items.filter((i) => i.category === active);
  const [lead, ...rest] = shown;
  return (
    <>
      <div className="filters" role="group" aria-label={labels.filter}>
        {categories.map((c) => (
          <label className="chip" key={c.key}>
            <input type="radio" name="category" value={c.key} checked={active === c.key} onChange={() => setUrlParams({ category: c.key })} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: "var(--s-6)" }} aria-live="polite">
        {!lead ? (
          <p className="muted">{labels.empty}</p>
        ) : (
          <>
            <Link href={lead.href} className="feature" style={{ textDecoration: "none", borderTop: "1px solid var(--ink)", paddingTop: "var(--s-5)", marginBottom: "var(--s-7)" }}>
              <div className="stack-4">
                <span className="kicker">{lead.categoryLabel} · {lead.dateLabel}</span>
                <h2 className="h1">{lead.title}</h2>
              </div>
              <div className="stack-4">
                <p className="lead">{lead.summary}</p>
                <span className="link-arrow" style={{ width: "fit-content" }}>{labels.read}</span>
              </div>
            </Link>
            <div className="articles">
              {rest.map((a) => (
                <Link key={a.slug} href={a.href} className="article-item">
                  <span className="kicker">{a.categoryLabel} · {a.dateLabel}</span>
                  <h3>{a.title}</h3>
                  <p className="muted">{a.summary}</p>
                  <span className="label">{a.readingTime}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
