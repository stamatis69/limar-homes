"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { StateMark } from "@/components/ui";
import { useCompare } from "@/lib/client/compare-store";
import { consentStore } from "@/lib/client/consent-store";
import { track } from "@/lib/client/analytics";
import { previousPath } from "@/lib/client/nav-memory";
import { BUDGETS, FIELDS, INTERESTS, validateField, type ErrorCode, type Field } from "@/lib/enquiry/validation";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { fill, formatArea, loc } from "@/lib/format";
import type { ResolvedUnit } from "@/lib/resolved";
import type { Localized } from "@/lib/types";

type Dict = Pick<Dictionary, "enquiry" | "common" | "status" | "pathfinder" | "footer">;

export interface EnquiryContext {
  development: { id: string; name: string; slug: string; locality: Localized; city: Localized } | null;
  unit: ResolvedUnit | null;
  compared: ResolvedUnit[];
  pathfinder: { outcome: string; route: string; budget: string; location: string; property: string } | null;
  source: string;
}

type Status = "idle" | "validating" | "submitting" | "success" | "network" | "timeout" | "server" | "rateLimited" | "rejected" | "unavailable";

interface Summary {
  firstName: string;
  developmentName: string | null;
  developmentSlug: string | null;
  location: string | null;
  unitId: string | null;
  unitLabel: string | null;
  unitStatus: ResolvedUnit["status"] | null;
  compared: Array<{ id: string; label: string; developmentName: string }>;
  interest: string;
  goldenVisaInterest: boolean;
  contactMethod: "email" | "phone" | "whatsapp";
}

const LANG_NAMES = { en: "English", el: "Ελληνικά", tr: "Türkçe" };

export function EnquiryForm({
  locale,
  dict,
  context,
  defaultInterest,
  countries,
  contact,
}: {
  locale: Locale;
  dict: Dict;
  context: EnquiryContext;
  defaultInterest: string;
  countries: Array<{ code: string; name: string }>;
  contact: { email: string; phone: string; whatsapp: string | null };
}) {
  const e = dict.enquiry;
  const compare = useCompare();
  const [values, setValues] = useState({
    interest: defaultInterest,
    firstName: "",
    lastName: "",
    email: "",
    contactMethod: "email",
    phone: "",
    country: "",
    language: locale as string,
    budget: context.pathfinder?.budget && context.pathfinder.budget !== "undisclosed" ? context.pathfinder.budget : "",
    message: "",
    goldenVisaInterest: defaultInterest === "golden-visa" || Boolean(context.pathfinder),
    marketingConsent: false,
    website: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<Field, ErrorCode>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<{ reference: string; data: Summary } | null>(null);
  const startedAt = useRef(0);
  const inFlight = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLHeadingElement>(null);
  const startedTracked = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success") {
      confirmRef.current?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [status]);

  const set = (name: keyof typeof values, value: string | boolean) => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      track("enquiry_start", { source: context.source, developmentId: context.development?.id, unitId: context.unit?.id });
    }
    const next = { ...values, [name]: value };
    setValues(next);
    // After a submit attempt, re-validate live so errors clear as they are fixed.
    if (submitted || touched[name as Field]) {
      const f = name as (typeof FIELDS)[number];
      if ((FIELDS as readonly string[]).includes(f)) setErrors((prev) => ({ ...prev, [f]: validateField(f, next) ?? undefined, ...(f === "contactMethod" ? { phone: validateField("phone", next) ?? undefined } : {}) }));
    }
  };

  const blur = (name: (typeof FIELDS)[number]) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const err = values[name] === "" && !submitted && name !== "phone" ? null : validateField(name, values);
    setErrors((prev) => ({ ...prev, [name]: err ?? undefined }));
  };

  const errorList = (Object.entries(errors) as Array<[Field, ErrorCode | undefined]>).filter(([, v]) => v);
  const label: Record<string, string> = {
    interest: e.interestLabel,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    contactMethod: e.contactMethod,
    phone: e.phone,
    country: e.country,
    language: e.language,
    budget: e.budget,
    message: e.message,
    development: e.contextDevelopment,
    unit: e.contextUnit,
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (inFlight.current) return; // duplicate-submission guard
    setSubmitted(true);
    setStatus("validating");
    const nextErrors: Partial<Record<Field, ErrorCode>> = {};
    for (const f of FIELDS) {
      const err = validateField(f, values);
      if (err) nextErrors[f] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("idle");
      Object.keys(nextErrors).forEach((field) => track("enquiry_validation_error", { field }));
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    track("enquiry_submit", { interest: values.interest, developmentId: context.development?.id, unitId: context.unit?.id });
    const campaign = consentStore.get() === "granted" ? utm() : null;
    const body = {
      ...values,
      startedAt: startedAt.current,
      context: {
        developmentId: context.development?.id ?? null,
        unitId: context.unit?.id ?? null,
        comparedUnitIds: context.compared.map((u) => u.id),
        sourcePage: sourcePage(),
        source: context.source,
        campaign,
        pathfinder: context.pathfinder,
      },
    };
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const data = (await res.json().catch(() => ({}))) as { reference?: string; summary?: Summary; errors?: Partial<Record<Field, ErrorCode>>; error?: string };
      if (res.status === 201 && data.reference && data.summary) {
        setSummary({ reference: data.reference, data: data.summary });
        setStatus("success");
        track("enquiry_success", { interest: values.interest, developmentId: context.development?.id, unitId: context.unit?.id });
      } else if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else if (res.status === 429) setStatus("rateLimited");
      else if (res.status === 400 || res.status === 403) setStatus("rejected");
      else if (res.status === 503) setStatus("unavailable");
      else setStatus("server");
    } catch (err) {
      setStatus(err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError") ? "timeout" : "network");
    } finally {
      inFlight.current = false;
    }
  }

  useEffect(() => {
    if (["network", "timeout", "server", "rateLimited", "rejected", "unavailable"].includes(status)) statusRef.current?.focus();
  }, [status]);

  if (status === "success" && summary) {
    return <Confirmation locale={locale} dict={dict} summary={summary} contact={contact} hasCompare={compare.ids.length > 0} headingRef={confirmRef} />;
  }

  const fieldProps = (name: (typeof FIELDS)[number]) => ({
    id: `f-${name}`,
    name,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": [errors[name] ? `e-${name}` : "", `h-${name}`].filter(Boolean).join(" ") || undefined,
    onBlur: () => blur(name),
  });
  const err = (name: Field) =>
    errors[name] ? (
      <p className="field-error" id={`e-${name}`}>
        {e.errors[errors[name]!]}
      </p>
    ) : null;
  const busy = status === "submitting" || status === "validating";
  const failure = ["network", "timeout", "server", "rateLimited", "rejected", "unavailable"].includes(status) ? (status as Exclude<Status, "idle" | "validating" | "submitting" | "success">) : null;

  return (
    <form className="form" noValidate onSubmit={onSubmit} aria-busy={busy}>
      <ContextCard locale={locale} dict={dict} context={context} />

      {errorList.length > 0 && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <p>
            <strong>{fill(e.errorSummary, { count: errorList.length })}</strong>
          </p>
          <ul>
            {errorList.map(([f, code]) => (
              <li key={f}>
                <a href={`#f-${f}`}>
                  {label[f]}: {e.errors[code!]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {failure && (
        <div className="status-banner" role="alert" tabIndex={-1} ref={statusRef}>
          <p>{e.states[failure === "rateLimited" ? "rateLimited" : failure]}</p>
          <p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a> · <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
          </p>
          {failure !== "rateLimited" && failure !== "unavailable" && (
            <div>
              <button type="submit" className="btn btn--small">
                {e.states.retry}
              </button>
            </div>
          )}
        </div>
      )}

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>{e.interestLabel}</legend>
        <div className="radio-row" id="f-interest">
          {INTERESTS.map((i) => (
            <label className="chip" key={i}>
              <input type="radio" name="interest" value={i} checked={values.interest === i} onChange={() => set("interest", i)} />
              <span>{e.interests[i]}</span>
            </label>
          ))}
        </div>
        {err("interest")}
      </fieldset>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-firstName">
            {e.firstName} <span className="req">({e.required})</span>
          </label>
          <input className="input" {...fieldProps("firstName")} autoComplete="given-name" value={values.firstName} onChange={(ev) => set("firstName", ev.target.value)} maxLength={80} required />
          {err("firstName")}
        </div>
        <div className="field">
          <label htmlFor="f-lastName">
            {e.lastName} <span className="req">({e.required})</span>
          </label>
          <input className="input" {...fieldProps("lastName")} autoComplete="family-name" value={values.lastName} onChange={(ev) => set("lastName", ev.target.value)} maxLength={80} required />
          {err("lastName")}
        </div>
        <div className="field field--full">
          <label htmlFor="f-email">
            {e.email} <span className="req">({e.required})</span>
          </label>
          <input className="input" {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={(ev) => set("email", ev.target.value)} maxLength={254} required />
          {err("email")}
        </div>
        <fieldset className="field field--full" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>{e.contactMethod}</legend>
          <div className="radio-row" id="f-contactMethod">
            {(["email", "phone", "whatsapp"] as const).map((m) => (
              <label className="chip" key={m}>
                <input type="radio" name="contactMethod" value={m} checked={values.contactMethod === m} onChange={() => set("contactMethod", m)} />
                <span>{e.methods[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field field--full">
          <label htmlFor="f-phone">
            {e.phone} <span className="req">({values.contactMethod === "email" ? e.optional : e.required})</span>
          </label>
          <input className="input" {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(ev) => set("phone", ev.target.value)} maxLength={30} />
          <p className="hint" id="h-phone">{e.phoneHint}</p>
          {err("phone")}
        </div>
        <div className="field">
          <label htmlFor="f-country">
            {e.country} <span className="req">({e.required})</span>
          </label>
          <select className="select" {...fieldProps("country")} autoComplete="country" value={values.country} onChange={(ev) => set("country", ev.target.value)} required>
            <option value="">{e.countryPlaceholder}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {err("country")}
        </div>
        <div className="field">
          <label htmlFor="f-language">{e.language}</label>
          <select className="select" {...fieldProps("language")} value={values.language} onChange={(ev) => set("language", ev.target.value)}>
            {(["en", "el", "tr"] as const).map((l) => (
              <option key={l} value={l} lang={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="more" open={Boolean(context.pathfinder) || values.interest === "golden-visa" || values.interest === "investment"}>
        <summary>{e.moreTitle}</summary>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="f-budget">{e.budget}</label>
            <select className="select" {...fieldProps("budget")} value={values.budget} onChange={(ev) => set("budget", ev.target.value)}>
              <option value="">{e.budgetNone}</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {e.budgets[b]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ alignContent: "end" }}>
            <label className="check">
              <input type="checkbox" checked={values.goldenVisaInterest} onChange={(ev) => set("goldenVisaInterest", ev.target.checked)} />
              <span>{e.gvInterest}</span>
            </label>
          </div>
          <div className="field field--full">
            <label htmlFor="f-message">{e.message}</label>
            <textarea className="textarea" {...fieldProps("message")} value={values.message} onChange={(ev) => set("message", ev.target.value)} maxLength={2000} />
            <p className="hint" id="h-message">{e.messageHint}</p>
            {err("message")}
          </div>
        </div>
      </details>

      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(ev) => set("website", ev.target.value)} />
      </div>

      <div className="stack-3">
        <p className="hint">
          {e.privacy} <Link href={href(locale, "/privacy-policy")}>{dict.footer.privacy}</Link>
        </p>
        <label className="check">
          <input type="checkbox" checked={values.marketingConsent} onChange={(ev) => set("marketingConsent", ev.target.checked)} />
          <span>{e.marketing}</span>
        </label>
      </div>

      <div className="cta-row">
        <button type="submit" className="btn btn--primary" disabled={busy} aria-disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> {e.submitting}
            </>
          ) : (
            <>
              {e.submit} <span className="arrow">→</span>
            </>
          )}
        </button>
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {busy ? e.submitting : ""}
      </p>
    </form>
  );
}

function ContextCard({ locale, dict, context }: { locale: Locale; dict: Dict; context: EnquiryContext }) {
  const e = dict.enquiry;
  const { development: dev, unit, compared, pathfinder } = context;
  return (
    <section className="context-card" aria-labelledby="ctx-title">
      <header>
        <h2 className="label" id="ctx-title">{e.contextTitle}</h2>
        {dev && (
          <Link href={href(locale, `/projects/${dev.slug}${unit ? `?unit=${encodeURIComponent(unit.id)}` : ""}#residences`)} style={{ fontSize: "0.86rem" }}>
            {e.contextChange}
          </Link>
        )}
      </header>
      <dl className="facts">
        {!dev && !pathfinder && (
          <>
            <dt className="label">—</dt>
            <dd>{e.contextNone}</dd>
          </>
        )}
        {dev && (
          <>
            <dt className="label">{e.contextDevelopment}</dt>
            <dd>
              {dev.name} · <span className="muted">{loc(dev.locality, locale)}, {loc(dev.city, locale)}</span>
            </dd>
          </>
        )}
        {unit && (
          <>
            <dt className="label">{e.contextUnit}</dt>
            <dd data-testid="ctx-unit">
              <span className="num" style={{ fontWeight: 600 }}>{unit.label}</span> · {unit.floor === 0 ? dict.common.ground : `${dict.common.floor} ${unit.floor}`} · {unit.bedrooms} {dict.common.bedroomsShort} · <span className="num">{formatArea(unit.area, locale)} m²</span> ·{" "}
              <StateMark status={unit.status} label={dict.status[unit.status]} />
            </dd>
          </>
        )}
        {compared.length > 0 && (
          <>
            <dt className="label">{e.contextAlso}</dt>
            <dd>{compared.map((u) => `${u.label} (${u.developmentName})`).join(", ")}</dd>
          </>
        )}
        {pathfinder && (
          <>
            <dt className="label">{e.contextPathfinder}</dt>
            <dd>{dict.pathfinder.outcomes[pathfinder.outcome as keyof Dict["pathfinder"]["outcomes"]]?.title ?? pathfinder.outcome}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function Confirmation({
  locale,
  dict,
  summary,
  contact,
  hasCompare,
  headingRef,
}: {
  locale: Locale;
  dict: Dict;
  summary: { reference: string; data: Summary };
  contact: { email: string; phone: string; whatsapp: string | null };
  hasCompare: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const e = dict.enquiry;
  const s = summary.data;
  const interest = e.interests[s.interest as keyof typeof e.interests] + (s.goldenVisaInterest && s.interest !== "golden-visa" ? ` + ${dict.common.goldenVisa}` : "");
  return (
    <section className="confirmation" aria-labelledby="confirm-title" data-testid="confirmation">
      <span className="stamp">✓ {e.confirmTitle}</span>
      <h2 className="h1" id="confirm-title" ref={headingRef} tabIndex={-1}>
        {e.confirmTitle}
      </h2>
      <p className="lead">{fill(e.confirmLead, { name: s.firstName })}</p>
      <dl className="facts" style={{ maxWidth: 640 }}>
        <dt className="label">{e.confirmReference}</dt>
        <dd className="num" data-testid="confirm-ref">{summary.reference}</dd>
        {s.developmentName && (
          <>
            <dt className="label">{e.confirmDevelopment}</dt>
            <dd data-testid="confirm-dev">{s.developmentName}</dd>
          </>
        )}
        {s.unitLabel && (
          <>
            <dt className="label">{e.confirmUnit}</dt>
            <dd data-testid="confirm-unit">
              <span className="num" style={{ fontWeight: 600 }}>{s.unitLabel}</span> {s.unitStatus && <StateMark status={s.unitStatus} label={dict.status[s.unitStatus]} />}
            </dd>
          </>
        )}
        {s.compared.length > 0 && (
          <>
            <dt className="label">{e.confirmAlso}</dt>
            <dd data-testid="confirm-also">{s.compared.map((u) => `${u.label} (${u.developmentName})`).join(", ")}</dd>
          </>
        )}
        {s.location && (
          <>
            <dt className="label">{e.confirmLocation}</dt>
            <dd>{s.location}</dd>
          </>
        )}
        <dt className="label">{e.confirmInterest}</dt>
        <dd>{interest}</dd>
        <dt className="label">{e.confirmContact}</dt>
        <dd>{e.methods[s.contactMethod]}</dd>
      </dl>
      <div className="stack-3">
        <h3 className="label">{e.confirmNext}</h3>
        <ol className="steps plain-list" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {e.confirmSteps.map((step) => (
            <li key={step}><p>{step}</p></li>
          ))}
        </ol>
      </div>
      <div className="cta-row">
        {s.developmentSlug && (
          <Link className="btn btn--primary" href={href(locale, `/projects/${s.developmentSlug}${s.unitId ? `?unit=${encodeURIComponent(s.unitId)}` : ""}#residences`)}>
            {e.returnDevelopment} <span className="arrow">→</span>
          </Link>
        )}
        {hasCompare && (
          <Link className="btn" href={href(locale, "/compare")}>
            {e.continueComparing}
          </Link>
        )}
        <Link className="link-arrow" href={href(locale, "/projects")}>
          {e.exploreOther}
        </Link>
        {contact.whatsapp && (
          <a className="link-arrow" href={`https://wa.me/${contact.whatsapp}`} rel="noopener" target="_blank">
            {dict.common.whatsapp}
          </a>
        )}
      </div>
    </section>
  );
}

/** The page the buyer came from (same-origin referrer), falling back to the enquiry page itself. */
function sourcePage(): string {
  const prev = previousPath();
  if (prev && !prev.includes("/enquire") && !prev.includes("/aitima") && !prev.includes("/talep")) return prev.slice(0, 200);
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.origin === window.location.origin) return (ref.pathname + ref.hash).slice(0, 200);
  } catch {
    /* ignore malformed referrer */
  }
  return window.location.pathname;
}

function utm(): Record<string, string> | null {
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}
