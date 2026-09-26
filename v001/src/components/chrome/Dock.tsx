"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { COMPARE_MAX, compareStore, useCompare } from "@/lib/client/compare-store";
import { consentStore, useConsent } from "@/lib/client/consent-store";
import { useResolvedUnits } from "@/lib/client/use-resolved-units";
import { track } from "@/lib/client/analytics";
import { notePath } from "@/lib/client/nav-memory";
import { recordFirstTouch } from "@/lib/client/campaign";
import { usePublicPath } from "@/lib/client/use-public-path";
import { fill } from "@/lib/format";
import { href, resolvePublicPath, type Locale } from "@/lib/i18n/routes";

interface DockLabels {
  consent: { title: string; body: string; accept: string; reject: string };
  compare: { tray: string; trayCount: string; open: string; clear: string; removed: string };
  remove: string;
  enquire: string;
  privacy: string;
}

/**
 * One bottom surface, one priority at a time:
 *   1. consent decision (until the visitor chooses)
 *   2. comparison tray (when units are selected; hidden on the compare page itself)
 *   3. contextual mobile CTA on development pages
 * Never stacks cookie banner + tray + sticky CTA on a phone.
 */
export function Dock({ locale, labels }: { locale: Locale; labels: DockLabels }) {
  const consent = useConsent();
  const compare = useCompare();
  const pathname = usePathname();
  const publicPath = usePublicPath();
  const resolved = resolvePublicPath(publicPath ?? "/");
  const internal = resolved.kind === "ok" ? resolved.internalPath : "/";
  const onCompare = internal.startsWith("/compare");
  const onEnquire = internal.startsWith("/enquire");
  const devMatch = internal.match(/^\/projects\/([^/]+)/);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => notePath(pathname + window.location.hash), [pathname]);
  // Attribution waits for consent; granting it on the landing page still captures that page's UTMs.
  // Read the store directly: during hydration the hook still reports the server snapshot ("denied"),
  // which must not be mistaken for a withdrawal of consent.
  useEffect(() => {
    const actual = consentStore.get();
    if (actual !== "unknown") recordFirstTouch(actual === "granted");
  }, [consent, pathname]);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  let mode: "consent" | "tray" | "cta" | "none" = "none";
  if (publicPath === null) mode = "none";
  else if (consent === "unknown") mode = "consent";
  else if (compare.ids.length > 0 && !onCompare && !onEnquire) mode = "tray";
  else if (devMatch) mode = "cta";

  // ResizeObserver reports the dock's height after layout and before paint, so body padding follows
  // without forcing a synchronous layout during hydration.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      document.documentElement.style.setProperty("--dock-h", `${Math.round(h)}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  return (
    <div className="dock" ref={ref}>
      <div className="dock-inner">
        {mode === "consent" && (
          <section className="consent" aria-label={labels.consent.title}>
            <div className="stack-2">
              <h2 className="label">{labels.consent.title}</h2>
              <p>
                {labels.consent.body}{" "}
                <Link href={href(locale, "/privacy-policy")}>{labels.privacy}</Link>
              </p>
            </div>
            <div className="cta-row">
              <button type="button" className="btn btn--small" onClick={() => consentStore.set(false)}>
                {labels.consent.reject}
              </button>
              <button type="button" className="btn btn--small btn--primary" onClick={() => consentStore.set(true)}>
                {labels.consent.accept}
              </button>
            </div>
          </section>
        )}
        {mode === "tray" && <Tray locale={locale} labels={labels} announce={announce} />}
        {mode === "cta" && devMatch && (
          <div className="context-cta">
            <Link className="btn btn--primary btn--small" href={href(locale, `/enquire?development=${devMatch[1]}&source=dock`)}>
              {labels.enquire}
            </Link>
          </div>
        )}
      </div>
      <p ref={liveRef} className="live-region" aria-live="polite" />
    </div>
  );
}

function Tray({ locale, labels, announce }: { locale: Locale; labels: DockLabels; announce: (msg: string) => void }) {
  const { ids } = useCompare();
  const res = useResolvedUnits(ids);
  const byId = new Map((res.data?.units ?? []).map((u) => [u.id, u]));
  return (
    <section className="tray" aria-label={labels.compare.tray}>
      <div>
        <p className="tray-title">{labels.compare.tray}</p>
        <p className="num" style={{ fontSize: "0.8rem" }}>
          {fill(labels.compare.trayCount, { count: ids.length, max: COMPARE_MAX })}
        </p>
      </div>
      <ul className="tray-items plain-list" aria-label={labels.compare.tray}>
        {ids.map((id) => {
          const u = byId.get(id);
          const label = u ? u.label : id.split(":")[1] ?? id;
          return (
            <li key={id} className="tray-item" data-unit={id}>
              <span className="num">{label}</span>
              <span className="tray-dev" title={u?.developmentName}>{u?.developmentName ?? "…"}</span>
              <button
                type="button"
                aria-label={`${labels.remove} ${label}`}
                onClick={() => {
                  compareStore.remove(id);
                  track("compare_remove", { unitId: id, source: "tray" });
                  announce(fill(labels.compare.removed, { unit: label }));
                }}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <div className="tray-actions">
        <button type="button" className="tray-clear" onClick={() => compareStore.clear()}>
          {labels.compare.clear}
        </button>
        <Link className="btn btn--primary btn--small" href={href(locale, "/compare")} onClick={() => track("comparison_open", { count: ids.length, source: "tray" })}>
          {labels.compare.open} ({ids.length}) <span className="arrow">→</span>
        </Link>
      </div>
    </section>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="link-button" style={{ background: "none", border: 0, padding: 0, textDecoration: "underline", textUnderlineOffset: "0.2em" }} onClick={() => consentStore.reset()}>
      {label}
    </button>
  );
}

/** Announces analytics page-level events for a development page. */
export function TrackView({ event, developmentId }: { event: "development_view"; developmentId: string }) {
  useEffect(() => {
    track(event, { developmentId });
  }, [event, developmentId]);
  return null;
}
