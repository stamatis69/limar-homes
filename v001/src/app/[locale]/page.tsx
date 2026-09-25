import Link from "next/link";
import type { Metadata } from "next";
import { Elevation } from "@/components/Elevation";
import { ChapterHead, Metric, StateMark, TitleBlock } from "@/components/ui";
import { availableCount, getCatalog } from "@/data/catalog";
import { articles } from "@/data/articles";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { fill, formatRange, loc } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/", title: dict.meta.homeTitle, description: dict.meta.homeDescription, absoluteTitle: true });
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  const dict = getDictionary(locale);
  const { developments } = getCatalog();
  const real = developments.filter((d) => d.id !== "fixture-stress");
  const current = real.filter((d) => d.status === "selling");
  const sold = real.filter((d) => d.status === "sold-out");
  const lead = current[0] ?? real[0]!;
  const leadAvailable = availableCount(lead);
  const municipalities = new Set(real.map((d) => d.locality.en)).size;
  const latest = [...articles].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 3);

  return (
    <>
      {/* A-00 — Opening: architecture first */}
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="kicker">{dict.home.heroKicker}</p>
            <h1 className="display" id="hero-title">
              <span>{dict.home.heroTitleA}</span>
              <span>{dict.home.heroTitleB}</span>
            </h1>
            <p className="lead">{dict.home.heroLead}</p>
            <div className="cta-row">
              <Link className="btn btn--primary" href={href(locale, "/projects")}>
                {dict.common.exploreDevelopments} <span className="arrow">→</span>
              </Link>
              <Link className="link-arrow" href={href(locale, "/golden-visa")}>
                {dict.common.goldenVisa}
              </Link>
            </div>
          </div>
          <div className="hero-sheet stack-3">
            <Elevation spec={lead.drawing} title={`${lead.name} — ${dict.common.schematic}`} caption={`A-01 · ${lead.name} · ${dict.common.schematic}`} />
            <TitleBlock
              cells={[
                { label: dict.home.currentLabel, value: <Link href={href(locale, `/projects/${lead.slug}`)}>{lead.name}</Link> },
                { label: dict.common.location, value: `${loc(lead.locality, locale)}, ${loc(lead.city, locale)}` },
                { label: dict.common.status, value: <StateMark status={lead.status} label={dict.status[lead.status]} /> },
                { label: dict.common.completion, value: loc(lead.completion.label, locale) },
              ]}
            />
          </div>
        </div>
      </section>

      {/* A-01 — Practice */}
      <section className="section--tight shell" aria-labelledby="practice-title">
        <ChapterHead sheet="A-01" title={dict.home.practiceTitle} id="practice-title" />
        <div className="practice">
          {dict.home.practice.map((p) => (
            <div key={p.title}>
              <h3>{p.title}</h3>
              <p className="muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A-02 — Developments: one feature + ledger of delivered work */}
      <section className="section shell" aria-labelledby="devs-title">
        <ChapterHead sheet="A-02" title={dict.home.selectedTitle} lead={dict.home.selectedLead} id="devs-title" />
        {current.map((d) => (
          <article key={d.id} className="feature" aria-labelledby={`f-${d.id}`}>
            <Elevation spec={d.drawing} title={`${d.name} — ${dict.common.schematic}`} caption={dict.common.schematic} animate={false} />
            <div className="feature-copy">
              <StateMark status={d.status} label={dict.status[d.status]} />
              <h3 className="h1" id={`f-${d.id}`}>
                <Link href={href(locale, `/projects/${d.slug}`)} style={{ textDecoration: "none" }}>
                  {d.name}
                </Link>
              </h3>
              <p className="lead">{loc(d.copy.intro, locale)}</p>
              <dl className="metrics">
                <Metric label={dict.common.units} value={loc(d.unitsTotalLabel, locale)} tbc={d.unverified.includes("unitsTotal")} />
                <Metric label={dict.common.size} value={formatRange(d.sizeMin, d.sizeMax, locale)} tbc={d.unverified.includes("sizeRange")} />
                <Metric label={dict.common.completion} value={loc(d.completion.label, locale)} />
              </dl>
              <div className="cta-row">
                <Link className="btn btn--primary" href={href(locale, `/projects/${d.slug}`)}>
                  {dict.common.viewDevelopment} <span className="arrow">→</span>
                </Link>
                <Link className="link-arrow" href={href(locale, `/enquire?development=${d.id}&source=home-feature`)}>
                  {dict.common.requestInformation}
                </Link>
              </div>
            </div>
          </article>
        ))}

        <h3 className="label" style={{ marginTop: "var(--s-8)", marginBottom: "var(--s-3)" }}>
          {dict.home.deliveredLabel}
        </h3>
        <div className="ledger-list">
          {sold.map((d) => (
            <Link key={d.id} href={href(locale, `/projects/${d.slug}`)} className="ledger-row">
              <span className="sheet-no">{d.sheet}</span>
              <span className="ledger-name">{d.name}</span>
              <span className="ledger-meta muted">
                {loc(d.locality, locale)} · {formatRange(d.sizeMin, d.sizeMax, locale)}
              </span>
              <span className="ledger-status">
                <StateMark status={d.status} label={dict.status[d.status]} />
              </span>
              <span className="ledger-thumb" aria-hidden="true">
                <Elevation spec={d.drawing} title={d.name} animate={false} compact />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* A-03 — Current opportunity (dynamic) */}
      <section className="section--tight shell" aria-labelledby="opp-title">
        <ChapterHead
          sheet="A-03"
          title={dict.home.opportunityTitle}
          id="opp-title"
          lead={leadAvailable == null ? dict.home.opportunityPending : fill(dict.home.opportunityCount, { count: leadAvailable, name: lead.name })}
        />
        <div className="cta-row">
          <Link className="btn" href={href(locale, `/projects/${lead.slug}#residences`)}>
            {dict.development.residencesTitle} <span className="arrow">→</span>
          </Link>
          <Link className="link-arrow" href={href(locale, `/enquire?development=${lead.id}&interest=purchase&source=home-opportunity`)}>
            {dict.development.residencesPendingCta}
          </Link>
        </div>
      </section>

      {/* A-04 — Night sheet: from place to capital */}
      <section className="night section" aria-labelledby="capital-title">
        <div className="shell">
          <ChapterHead sheet="A-04" kicker={dict.home.capitalKicker} title={dict.home.capitalTitle} id="capital-title" />
          <div className="split" style={{ marginBottom: "var(--s-7)" }}>
            <p className="lead">{dict.home.capitalBody}</p>
            <div className="cta-row" style={{ alignSelf: "end" }}>
              <Link className="btn btn--primary" href={href(locale, "/golden-visa/pathfinder")}>
                {dict.home.capitalCta} <span className="arrow">→</span>
              </Link>
              <Link className="link-arrow" href={href(locale, "/golden-visa")}>
                {dict.home.capitalSecondary}
              </Link>
            </div>
          </div>
          <div className="routes">
            {dict.gv.routes.map((r) => (
              <div className="route" key={r.amount}>
                <span className="route-amount">{r.amount}</span>
                <h3 style={{ fontWeight: 560 }}>{r.title}</h3>
                <p className="muted">{r.body}</p>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: "var(--s-5)", fontSize: "0.84rem" }}>
            {dict.gv.reviewed} {dict.common.notLegalAdvice}
          </p>
        </div>
      </section>

      {/* A-05 — Evidence */}
      <section className="section shell" aria-labelledby="evidence-title">
        <ChapterHead sheet="A-05" title={dict.home.evidenceTitle} lead={dict.home.evidenceLead} id="evidence-title" />
        <div className="evidence">
          <div>
            <p className="big num">{real.length}</p>
            <p className="muted">{dict.home.evidenceDevelopments}</p>
          </div>
          <div>
            <p className="big num">{sold.length}</p>
            <p className="muted">{dict.home.evidenceSold}</p>
          </div>
          <div>
            <p className="big num">{municipalities}</p>
            <p className="muted">{dict.home.evidenceLocations}</p>
          </div>
        </div>
        <div className="split" style={{ marginTop: "var(--s-8)" }}>
          <div className="stack-4">
            <h3 className="h3">{dict.home.processTitle}</h3>
            <p className="muted">{dict.home.processNote}</p>
          </div>
          <div className="stack-4">
            <h3 className="h3">{dict.home.recognitionTitle}</h3>
            <p>
              <Link href={href(locale, site.recognition[0].href)}>{dict.home.recognitionLLA}</Link>
            </p>
            <p className="label">{dict.home.recognitionSource}</p>
          </div>
        </div>
        <ol className="steps plain-list" style={{ marginTop: "var(--s-6)" }}>
          {dict.home.process.map((s) => (
            <li key={s.title}>
              <h4 style={{ fontWeight: 560 }}>{s.title}</h4>
              <p className="muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* A-06 — Athens context */}
      <section className="section--tight shell" aria-labelledby="context-title" style={{ background: "var(--paper-2)", maxWidth: "none" }}>
        <div className="shell" style={{ paddingInline: 0 }}>
          <ChapterHead sheet="A-06" title={dict.home.contextTitle} id="context-title" />
          <div className="three">
            {dict.home.context.map((c) => (
              <div key={c.title} className="stack-3" style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "var(--s-4)" }}>
                <h3 className="h3">{c.title}</h3>
                <p className="muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A-07 — Insights */}
      <section className="section shell" aria-labelledby="insights-title">
        <ChapterHead sheet="A-07" title={dict.home.insightsTitle} id="insights-title" />
        <div className="articles">
          {latest.map((a) => (
            <Link key={a.slug} href={href(locale, `/news/${a.slug}`)} className="article-item">
              <span className="kicker">{dict.news.categories[a.category]}</span>
              <h3>{loc(a.title, locale)}</h3>
              <p className="muted">{loc(a.summary, locale)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* A-08 — Finale: architecture and human contact */}
      <section className="section shell" aria-labelledby="finale-title" style={{ borderTop: "1px solid var(--ink)" }}>
        <div className="finale">
          <div className="stack-5">
            <span className="sheet-no">A-08</span>
            <h2 className="display" id="finale-title" style={{ fontSize: "var(--step-4)" }}>
              {dict.home.finaleTitle}
            </h2>
            <p className="lead">{dict.home.finaleBody}</p>
            <div className="cta-row">
              <Link className="btn btn--primary" href={href(locale, "/enquire?interest=purchase&source=home-finale")}>
                {dict.common.bookConsultation} <span className="arrow">→</span>
              </Link>
              <Link className="link-arrow" href={href(locale, "/golden-visa/pathfinder")}>
                {dict.common.speakSpecialist}
              </Link>
            </div>
          </div>
          <address className="contact-lines" style={{ fontStyle: "normal" }}>
            <span className="label">{dict.contact.officeTitle}</span>
            <span>
              {site.office.street}, {site.office.postalCode} {site.office.locality}
            </span>
            <a href={`tel:${site.phone.tel}`}>{site.phone.display}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span className="muted">{dict.contact.hours}</span>
          </address>
        </div>
      </section>
    </>
  );
}
