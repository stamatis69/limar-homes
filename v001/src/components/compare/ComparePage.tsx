"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StateMark } from "@/components/ui";
import { compareStore, useCompare } from "@/lib/client/compare-store";
import { useResolvedUnits } from "@/lib/client/use-resolved-units";
import { track } from "@/lib/client/analytics";
import { computeDifferences, type CompareAttr, type DiffTag } from "@/lib/compare-logic";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { fill, formatArea, formatPrice, loc } from "@/lib/format";
import type { ResolvedUnit } from "@/lib/resolved";

type Dict = Pick<Dictionary, "compare" | "explorer" | "status" | "common" | "development" | "amenities">;

export function ComparePage({ locale, dict }: { locale: Locale; dict: Dict }) {
  const c = dict.compare;
  const { ids, primary, seenStatus } = useCompare();
  const res = useResolvedUnits(ids);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [index, setIndex] = useState(0);
  const tracked = useRef(false);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const swiperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tracked.current && ids.length) {
      tracked.current = true;
      track("comparison_open", { count: ids.length, source: "page" });
    }
  }, [ids.length]);

  const byId = new Map((res.data?.units ?? []).map((u) => [u.id, u]));
  const units = ids.map((id) => byId.get(id)).filter((u): u is ResolvedUnit => Boolean(u));
  const missing = res.data?.missing ?? [];
  const diffs = computeDifferences(units);
  const safeIndex = Math.min(index, Math.max(units.length - 1, 0));
  const goTo = (i: number) => {
    setIndex(i);
    const el = swiperRef.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  };

  if (ids.length === 0) {
    return (
      <div className="pending-slot" style={{ minHeight: 280 }}>
        <p className="h3">{c.empty}</p>
        <p>{c.emptyBody}</p>
        <div>
          <Link className="btn btn--primary" href={href(locale, "/projects?status=selling")}>
            {c.browse} <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }
  if (res.state === "loading" && !res.data) return <p className="label" role="status">…</p>;

  const remove = (id: string, label: string) => {
    compareStore.remove(id);
    track("compare_remove", { unitId: id, source: "compare-page" });
    if (liveRef.current) liveRef.current.textContent = fill(c.removed, { unit: label });
  };

  const tagLabel: Record<DiffTag, string> = {
    largest: c.largest,
    extraBedroom: c.extraBedroom,
    higherFloor: c.higherFloor,
    lowestPrice: c.lowestPrice,
    onlyAvailable: c.onlyAvailable,
    hasOutdoor: c.hasOutdoor,
    hasParking: c.hasParking,
  };

  const floorText = (u: ResolvedUnit) => (u.floor === 0 ? dict.common.ground : `${dict.common.floor} ${u.floor}`);
  const priceText = (u: ResolvedUnit) =>
    u.status === "sold" ? "—" : u.price != null ? formatPrice(u.price, locale) : dict.common.priceOnRequest;
  const unitHref = (u: ResolvedUnit) => href(locale, `/projects/${u.developmentSlug}?unit=${encodeURIComponent(u.id)}#residences`);

  const rows: Array<{ attr: CompareAttr; label: string; render: (u: ResolvedUnit) => ReactNode; tagsFor?: DiffTag[] }> = [
    { attr: "development", label: c.development, render: (u) => <Link href={href(locale, `/projects/${u.developmentSlug}`)}>{u.developmentName}</Link> },
    { attr: "location", label: dict.common.location, render: (u) => loc(u.locality, locale) },
    {
      attr: "status",
      label: dict.common.status,
      render: (u) => (
        <div className="stack-2">
          <StateMark status={u.status} label={dict.status[u.status]} />
          {seenStatus[u.id] && seenStatus[u.id] !== u.status && <span className="warn-tag">{c.statusChanged}</span>}
        </div>
      ),
      tagsFor: ["onlyAvailable"],
    },
    {
      attr: "price",
      label: dict.explorer.price,
      render: (u) => (
        <span className="num">
          {priceText(u)}
          {diffs.priceAboveLowest[u.id] != null && (
            <span className="muted" style={{ display: "block", fontSize: "0.8rem" }}>
              {fill(c.priceDiff, { amount: formatPrice(diffs.priceAboveLowest[u.id]!, locale) })}
            </span>
          )}
        </span>
      ),
      tagsFor: ["lowestPrice"],
    },
    { attr: "floor", label: dict.common.floor, render: (u) => <span className="num">{floorText(u)}</span>, tagsFor: ["higherFloor"] },
    { attr: "area", label: dict.explorer.area, render: (u) => <span className="num">{formatArea(u.area, locale)} m²</span>, tagsFor: ["largest"] },
    { attr: "outdoor", label: dict.explorer.outdoor, render: (u) => <span className="num">{u.outdoorArea != null ? `${formatArea(u.outdoorArea, locale)} m²` : dict.common.notProvided}</span>, tagsFor: ["hasOutdoor"] },
    { attr: "bedrooms", label: dict.common.bedrooms, render: (u) => <span className="num">{u.bedrooms}</span>, tagsFor: ["extraBedroom"] },
    { attr: "bathrooms", label: dict.explorer.bathrooms, render: (u) => <span className="num">{u.bathrooms ?? dict.common.notProvided}</span> },
    { attr: "orientation", label: dict.explorer.orientation, render: (u) => (u.orientation ? loc(u.orientation, locale) : dict.common.notProvided) },
    { attr: "parking", label: dict.explorer.parking, render: (u) => (u.parking == null ? dict.common.notProvided : u.parking ? dict.explorer.yes : dict.explorer.no), tagsFor: ["hasParking"] },
    { attr: "completion", label: dict.common.completion, render: (u) => loc(u.completionLabel, locale) },
    { attr: "energy", label: dict.common.energyClass, render: (u) => <span className="num">{u.energyClassLabel}</span> },
    {
      attr: "floorplan",
      label: dict.explorer.floorplan,
      render: (u) =>
        u.floorplan ? (
          <Link href={unitHref(u)}>{dict.explorer.floorplan} →</Link>
        ) : (
          <span className="muted">{dict.explorer.floorplanPending}</span>
        ),
    },
    {
      attr: "goldenVisa",
      label: dict.development.gvTitle,
      render: (u) => (u.goldenVisaStatement ? <span className="muted" style={{ fontSize: "0.86rem" }}>{dict.common.goldenVisa}: {dict.common.toBeConfirmed}</span> : "—"),
    },
  ];
  const visibleRows = onlyDiff && units.length > 1 ? rows.filter((r) => diffs.differing.has(r.attr)) : rows;

  const Tags = ({ u, row }: { u: ResolvedUnit; row: (typeof rows)[number] }) => (
    <>
      {(row.tagsFor ?? []).filter((t) => diffs.tags[u.id]?.includes(t)).map((t) => (
        <span key={t} className="diff-tag">{tagLabel[t]}</span>
      ))}
    </>
  );

  const shortlistHref = () => {
    const main = primary && ids.includes(primary) ? primary : units[0]?.id;
    const others = units.map((u) => u.id).filter((id) => id !== main);
    const dev = units.find((u) => u.id === main)?.developmentId ?? "";
    return href(locale, `/enquire?development=${dev}&unit=${encodeURIComponent(main ?? "")}&compare=${encodeURIComponent(others.join(","))}&source=compare`);
  };

  const Head = ({ u, group }: { u: ResolvedUnit; group: string }) => (
    <div className="compare-unit-head">
      <span className="unit-id">{u.label}</span>
      <span className="dev-name">{u.developmentName}</span>
      <label className="check" style={{ fontSize: "0.84rem" }}>
        <input type="radio" name={`primary-${group}`} checked={primary === u.id} onChange={() => compareStore.setPrimary(u.id)} />
        {c.primary}
      </label>
      <div className="cta-row" style={{ gap: 6 }}>
        <Link className="btn btn--small btn--quiet" href={unitHref(u)}>{c.openDevelopment}</Link>
        <button type="button" className="btn btn--small btn--quiet" onClick={() => remove(u.id, u.label)} aria-label={`${dict.common.remove} ${u.label}`}>
          {dict.common.remove}
        </button>
      </div>
    </div>
  );

  return (
    <div className="stack-5">
      <div className="explorer-toolbar">
        <label className="check" style={{ alignItems: "center" }}>
          <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
          {c.onlyDifferences}
        </label>
        <button type="button" className="tray-clear" style={{ color: "var(--ink-2)" }} onClick={() => compareStore.clear()}>
          {c.clear}
        </button>
      </div>

      {missing.map((id) => (
        <div key={id} className="notice" role="status">
          <p><strong className="num">{id.split(":")[1] ?? id}</strong> — {c.unavailable}</p>
          <p className="muted">{c.unavailableBody}</p>
          <div><button type="button" className="btn btn--small" onClick={() => remove(id, id)}>{dict.common.remove}</button></div>
        </div>
      ))}

      {/* Desktop: side-by-side table with sticky attribute column */}
      <div className="compare-desktop compare-wrap">
        <table className="compare-table">
          <caption className="visually-hidden">{c.title}</caption>
          <thead>
            <tr>
              <th scope="col"><span className="label">{c.attribute}</span></th>
              {units.map((u) => (
                <th scope="col" key={u.id}><Head u={u} group="table" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.attr} className={diffs.differing.has(row.attr) && units.length > 1 ? "is-diff" : undefined}>
                <th scope="row">
                  {row.label}
                  {diffs.differing.has(row.attr) && units.length > 1 && <span className="diff-mark" title={c.differences}><span aria-hidden="true"> ≠</span><span className="visually-hidden"> ({c.differences})</span></span>}
                </th>
                {units.map((u) => (
                  <td key={u.id}>
                    {row.render(u)}
                    <div><Tags u={u} row={row} /></div>
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row"><span className="visually-hidden">{dict.explorer.enquire}</span></th>
              {units.map((u) => (
                <td key={u.id}>
                  {u.status !== "sold" && (
                    <Link className="btn btn--small btn--primary" href={href(locale, `/enquire?development=${u.developmentId}&unit=${encodeURIComponent(u.id)}&source=compare`)}>
                      {c.enquireOne}
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile: one unit at a time, swipeable, attribute names inline */}
      <div className="compare-mobile">
        {units.length > 1 && (
          <div className="pf-nav">
            <button type="button" className="btn btn--small btn--quiet" onClick={() => goTo(Math.max(0, safeIndex - 1))} disabled={safeIndex === 0} aria-label={c.prev}>←</button>
            <span className="label" aria-live="polite">{fill(c.showing, { index: safeIndex + 1, count: units.length })}</span>
            <button type="button" className="btn btn--small btn--quiet" onClick={() => goTo(Math.min(units.length - 1, safeIndex + 1))} disabled={safeIndex >= units.length - 1} aria-label={c.nextUnit}>→</button>
          </div>
        )}
        <div
          className="swiper"
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 1;
            setIndex(Math.round(el.scrollLeft / w));
          }}
          ref={swiperRef}
        >
          {units.map((u) => (
            <article key={u.id} aria-label={`${u.label} — ${u.developmentName}`}>
              <Head u={u} group="cards" />
              <dl className="facts">
                {visibleRows.slice(1).map((row) => (
                  <FactRow key={row.attr} label={row.label} diff={diffs.differing.has(row.attr) && units.length > 1}>
                    {row.render(u)} <Tags u={u} row={row} />
                  </FactRow>
                ))}
              </dl>
              {u.status !== "sold" && (
                <Link className="btn btn--primary btn--small" href={href(locale, `/enquire?development=${u.developmentId}&unit=${encodeURIComponent(u.id)}&source=compare`)}>
                  {c.enquireOne}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>

      {units.length > 0 && (
        <div className="cta-row" style={{ borderTop: "1px solid var(--ink)", paddingTop: "var(--s-5)" }}>
          <Link className="btn btn--primary" href={shortlistHref()}>
            {c.enquireAll} <span className="arrow">→</span>
          </Link>
          <Link className="link-arrow" href={href(locale, "/projects")}>{c.browse}</Link>
        </div>
      )}
      <p ref={liveRef} className="live-region" aria-live="polite" />
    </div>
  );
}

function FactRow({ label, diff, children }: { label: string; diff: boolean; children: ReactNode }) {
  return (
    <>
      <dt className="label">
        {label}
        {diff && <span className="diff-mark" aria-hidden="true"> ≠</span>}
      </dt>
      <dd>{children}</dd>
    </>
  );
}
