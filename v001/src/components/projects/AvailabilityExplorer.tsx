"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Elevation, type FloorMeta } from "@/components/Elevation";
import { StateMark } from "@/components/ui";
import { COMPARE_MAX, compareStore, useCompare } from "@/lib/client/compare-store";
import { track } from "@/lib/client/analytics";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { fill, floorLabel, formatArea, formatDate, formatPrice, loc } from "@/lib/format";
import type { DrawingSpec, Unit } from "@/lib/types";

type Dict = Pick<Dictionary, "explorer" | "status" | "common" | "compare">;

interface Props {
  locale: Locale;
  development: { id: string; slug: string; name: string; drawing: DrawingSpec };
  units: Unit[];
  asOf: string | null;
  dict: Dict;
}

export function AvailabilityExplorer({ locale, development, units, asOf, dict }: Props) {
  const d = dict.explorer;
  const compare = useCompare();
  const [view, setView] = useState<"plan" | "table">("plan");
  const [floor, setFloor] = useState<number | null>(null);
  const [bedrooms, setBedrooms] = useState<number | "all">("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const bedroomOptions = useMemo(() => [...new Set(units.map((u) => u.bedrooms))].sort(), [units]);
  const floors = useMemo(() => [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a), [units]);
  const filtered = units.filter((u) => (bedrooms === "all" || u.bedrooms === bedrooms) && (!availableOnly || u.status === "available"));
  const floorMeta: FloorMeta[] = floors.map((f) => {
    const onFloor = units.filter((u) => u.floor === f);
    return { floor: f, total: onFloor.length, available: onFloor.filter((u) => u.status === "available").length };
  });
  const onFloor = floor == null ? filtered : filtered.filter((u) => u.floor === floor);
  // Long schedules: show a first page when no floor is chosen, so mobile buyers are not handed 40+ rows.
  const PAGE = 12;
  const truncated = floor == null && !showAll && !open && onFloor.length > PAGE;
  const visible = truncated ? onFloor.slice(0, PAGE) : onFloor;

  // Deep link: ?unit=<id> opens the unit and selects its floor.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("unit");
    const unit = id ? units.find((u) => u.id === id) : undefined;
    if (unit) {
      // Deep links are read after mount: the page is statically generated, so the query is client-only.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFloor(unit.floor);
      setOpen(unit.id);
      track("unit_view", { unitId: unit.id, developmentId: unit.developmentId, source: "deep-link" });
      requestAnimationFrame(() => document.getElementById(`unit-${cssId(unit.id)}`)?.scrollIntoView({ block: "center" }));
    }
  }, [units]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleCompare = (u: Unit) => {
    if (compare.ids.includes(u.id)) {
      compareStore.remove(u.id);
      track("compare_remove", { unitId: u.id, developmentId: u.developmentId, source: "explorer" });
      setToast(fill(dict.compare.removed, { unit: u.label }));
      return;
    }
    const ok = compareStore.add(u.id, u.status);
    if (!ok) {
      setToast(fill(dict.compare.limit, { max: COMPARE_MAX }));
      return;
    }
    track("compare_add", { unitId: u.id, developmentId: u.developmentId, unitStatus: u.status });
    setToast(fill(dict.compare.added, { unit: u.label }));
  };

  const toggleOpen = (u: Unit) => {
    const next = open === u.id ? null : u.id;
    setOpen(next);
    if (next) track("unit_view", { unitId: u.id, developmentId: u.developmentId });
  };

  const enquireHref = (u: Unit) => href(locale, `/enquire?development=${development.id}&unit=${encodeURIComponent(u.id)}&source=explorer`);
  const floorName = (f: number) => (f === 0 ? dict.common.ground : `${dict.common.floor} ${floorLabel(f, locale, dict.common.ground)}`);

  return (
    <div className="explorer">
      <div className="explorer-toolbar">
        <div className="segmented" role="group" aria-label={d.title}>
          <button type="button" aria-pressed={view === "plan"} onClick={() => setView("plan")}>
            {d.viewPlan}
          </button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>
            {d.viewTable}
          </button>
        </div>
        <div className="filters" style={{ border: 0, padding: 0 }}>
          {bedroomOptions.length > 1 && (
            <fieldset>
              <legend className="label" style={{ marginRight: 8 }}>{d.filterBedrooms}</legend>
              {(["all", ...bedroomOptions] as Array<number | "all">).map((b) => (
                <label className="chip" key={String(b)}>
                  <input type="radio" name={`bed-${development.id}`} checked={bedrooms === b} onChange={() => setBedrooms(b)} />
                  <span>{b === "all" ? dict.common.all : b}</span>
                </label>
              ))}
            </fieldset>
          )}
          <label className="check" style={{ alignItems: "center" }}>
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
            {d.filterAvailableOnly}
          </label>
        </div>
      </div>

      <div className="legend" aria-label={d.legend}>
        {(["available", "under-offer", "reserved", "sold"] as const).map((s) => (
          <StateMark key={s} status={s} label={dict.status[s]} />
        ))}
        {asOf && <span className="label" style={{ marginLeft: "auto" }}>{fill(d.asOf, { date: formatDate(asOf, locale) })}</span>}
      </div>

      {view === "plan" ? (
        <div className="explorer-grid">
          <div>
            <Elevation
              spec={development.drawing}
              title={`${development.name} — ${dict.common.schematic}`}
              caption={dict.common.schematic}
              floorMeta={floorMeta}
              selectedFloor={floor}
              onFloorSelect={(f) => setFloor((cur) => (cur === f ? null : f))}
              animate={false}
            />
          </div>
          <div>
            <h3 className="label" style={{ marginBottom: 8 }}>{d.floorList}</h3>
            <div className="floor-list">
              <button type="button" aria-pressed={floor === null} onClick={() => setFloor(null)}>
                <span className="num">—</span>
                <span>{d.allFloors}</span>
                <span className="num muted">{units.filter((u) => u.status === "available").length}/{units.length}</span>
              </button>
              {floorMeta.map((m) => (
                <button type="button" key={m.floor} aria-pressed={floor === m.floor} onClick={() => setFloor(floor === m.floor ? null : m.floor)}>
                  <span className="num">{m.floor === 0 ? "0" : String(m.floor).padStart(2, "0")}</span>
                  <span className="bar" aria-hidden="true">
                    <i style={{ width: `${m.total ? (m.available / m.total) * 100 : 0}%` }} />
                  </span>
                  <span className="num" style={{ fontSize: "0.82rem" }}>
                    <span className="visually-hidden">{floorName(m.floor)}: </span>
                    {fill(d.floorSummary, { available: m.available, total: m.total })}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p className="visually-hidden" role="status" aria-live="polite">
              {floor != null ? fill(d.selectedFloor, { floor: floorName(floor) }) : d.allFloors}
            </p>
            <ul className="units plain-list" aria-label={floor != null ? floorName(floor) : d.allFloors}>
              {visible.length === 0 && <li className="muted" style={{ padding: "16px 0" }}>{d.noUnits}</li>}
              {visible.map((u) => {
                const inCompare = compare.ids.includes(u.id);
                const isOpen = open === u.id;
                return (
                  <li key={u.id} id={`unit-${cssId(u.id)}`} className={`unit-row${u.status === "sold" ? " is-sold" : ""}`}>
                    <span className="unit-id">{u.label}</span>
                    <span className="unit-attrs">
                      <span className="unit-attr num">{floorName(u.floor)}</span>
                      <span className="unit-attr num">{u.bedrooms} {u.bedrooms === 1 ? dict.common.bedroom : dict.common.bedrooms}</span>
                      <span className="unit-attr num">{formatArea(u.area, locale)} m²</span>
                    </span>
                    <StateMark status={u.status} label={dict.status[u.status]} />
                    <span className="unit-actions">
                      <button type="button" className="btn btn--small btn--quiet" aria-expanded={isOpen} aria-controls={`detail-${cssId(u.id)}`} onClick={() => toggleOpen(u)}>
                        {isOpen ? d.hideDetails : d.details}
                      </button>
                      {u.status !== "sold" && (
                        <button type="button" className="btn btn--small btn--quiet compare-toggle" aria-pressed={inCompare} onClick={() => toggleCompare(u)} data-compare={u.id}>
                          {inCompare ? `✓ ${d.inCompare}` : `+ ${d.compare}`}
                          <span className="visually-hidden"> {u.label}</span>
                        </button>
                      )}
                      {u.status !== "sold" && (
                        <Link className="btn btn--small btn--primary" href={enquireHref(u)}>
                          {d.enquire}
                          <span className="visually-hidden"> {u.label}</span>
                        </Link>
                      )}
                    </span>
                    {isOpen && <UnitDetail id={`detail-${cssId(u.id)}`} unit={u} locale={locale} dict={dict} />}
                  </li>
                );
              })}
            </ul>
            {truncated && (
              <button type="button" className="btn btn--quiet" style={{ marginTop: "var(--s-4)", width: "100%" }} onClick={() => setShowAll(true)}>
                {fill(d.showAll, { count: onFloor.length })}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="schedule-table">
            <caption className="label">{fill(d.tableCaption, { name: development.name })}</caption>
            <thead>
              <tr>
                <th scope="col">{d.unit}</th>
                <th scope="col" className="n">{dict.common.floor}</th>
                <th scope="col" className="n">{dict.common.bedrooms}</th>
                <th scope="col" className="n">{d.area} m²</th>
                <th scope="col" className="n">{d.outdoor} m²</th>
                <th scope="col">{dict.common.status}</th>
                <th scope="col" className="n">{d.price}</th>
                <th scope="col"><span className="visually-hidden">{d.compare}</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <th scope="row" className="num">{u.label}</th>
                  <td className="n">{u.floor === 0 ? dict.common.ground : u.floor}</td>
                  <td className="n">{u.bedrooms}</td>
                  <td className="n">{formatArea(u.area, locale)}</td>
                  <td className="n">{u.outdoorArea != null ? formatArea(u.outdoorArea, locale) : "—"}</td>
                  <td><StateMark status={u.status} label={dict.status[u.status]} /></td>
                  <td className="n">{u.price != null && u.status !== "sold" ? formatPrice(u.price, locale) : u.status === "sold" ? "—" : dict.common.priceOnRequest}</td>
                  <td>
                    {u.status !== "sold" && (
                      <button type="button" className="btn btn--small btn--quiet compare-toggle" aria-pressed={compare.ids.includes(u.id)} onClick={() => toggleCompare(u)}>
                        {compare.ids.includes(u.id) ? "✓" : "+"} <span className="visually-hidden">{d.compare} {u.label}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function UnitDetail({ id, unit, locale, dict }: { id: string; unit: Unit; locale: Locale; dict: Dict }) {
  const d = dict.explorer;
  useEffect(() => {
    if (unit.floorplan) track("floorplan_view", { unitId: unit.id, developmentId: unit.developmentId });
  }, [unit]);
  return (
    <div className="unit-detail" id={id}>
      <dl className="facts">
        <dt className="label">{d.area}</dt>
        <dd className="num">{formatArea(unit.area, locale)} m²</dd>
        <dt className="label">{d.outdoor}</dt>
        <dd className="num">{unit.outdoorArea != null ? `${formatArea(unit.outdoorArea, locale)} m²` : dict.common.notProvided}</dd>
        <dt className="label">{d.bathrooms}</dt>
        <dd className="num">{unit.bathrooms ?? dict.common.notProvided}</dd>
        <dt className="label">{d.orientation}</dt>
        <dd>{unit.orientation ? loc(unit.orientation, locale) : dict.common.notProvided}</dd>
        <dt className="label">{d.parking}</dt>
        <dd>{unit.parking == null ? dict.common.notProvided : unit.parking ? d.yes : d.no}</dd>
        <dt className="label">{d.price}</dt>
        <dd className="num">{unit.price != null && unit.status !== "sold" ? formatPrice(unit.price, locale) : dict.common.priceOnRequest}</dd>
      </dl>
      <div>
        {unit.floorplan ? (
          <figure className="plan-frame">
            <Image src={unit.floorplan.src} alt={loc(unit.floorplan.alt, locale)} width={unit.floorplan.width} height={unit.floorplan.height} unoptimized />
          </figure>
        ) : (
          <div className="pending-slot" style={{ minHeight: 160 }}>
            <p>{d.floorplanPending}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cssId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
