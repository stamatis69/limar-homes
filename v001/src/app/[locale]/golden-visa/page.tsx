import type { Metadata } from "next";
import Link from "next/link";
import { ChapterHead } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[locale]/golden-visa">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/golden-visa", title: dict.meta.gvTitle, description: dict.meta.gvDescription });
}

export default async function GoldenVisaPage({ params }: PageProps<"/[locale]/golden-visa">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const g = dict.gv;
  return (
    <>
      <section className="night" aria-labelledby="gv-title">
        <div className="shell page-head" style={{ paddingBottom: "var(--s-8)" }}>
          <p className="kicker">{g.kicker}</p>
          <h1 className="display" id="gv-title" style={{ fontSize: "var(--step-5)", maxWidth: "14em" }}>{g.title}</h1>
          <p className="lead">{g.lead}</p>
          <div className="cta-row" style={{ marginTop: "var(--s-4)" }}>
            <Link className="btn btn--primary" href={href(locale, "/golden-visa/pathfinder")}>
              {g.pathfinderCta} <span className="arrow">→</span>
            </Link>
            <Link className="link-arrow" href={href(locale, "/enquire?interest=golden-visa&source=golden-visa")}>
              {dict.common.speakSpecialist}
            </Link>
          </div>
          <p className="label" style={{ marginTop: "var(--s-5)" }}>{g.reviewed}</p>
        </div>
        <div className="shell" style={{ paddingBottom: "var(--s-9)" }}>
          <ChapterHead sheet="G-01" title={g.routesTitle} id="routes" />
          <div className="routes">
            {g.routes.map((r) => (
              <div className="route" key={r.amount}>
                <span className="route-amount">{r.amount}</span>
                <h3 style={{ fontWeight: 560 }}>{r.title}</h3>
                <p className="muted">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell" aria-labelledby="rules">
        <ChapterHead sheet="G-02" title={g.rulesTitle} id="rules" />
        <div className="three" style={{ rowGap: "var(--s-6)" }}>
          {g.rules.map((r) => (
            <div key={r.title} className="stack-3" style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "var(--s-4)" }}>
              <h3 className="h3">{r.title}</h3>
              <p className="muted">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section shell" aria-labelledby="limar" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet="G-03" title={g.limarTitle} id="limar" />
        <div className="split">
          <div className="notice notice--gv">
            <p>{g.limarBody}</p>
            <div className="cta-row">
              <Link className="btn btn--primary" href={href(locale, "/golden-visa/pathfinder")}>
                {g.pathfinderCta} <span className="arrow">→</span>
              </Link>
              <Link className="link-arrow" href={href(locale, "/projects/terrace-heights")}>Terrace Heights</Link>
            </div>
          </div>
          <div className="stack-4">
            <h3 className="h3">{g.whoTitle}</h3>
            <ul className="spec-list plain-list" style={{ gridTemplateColumns: "1fr" }}>
              {g.who.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section shell" aria-labelledby="process" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet="G-04" title={g.processTitle} id="process" />
        <ol className="steps plain-list" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {g.process.map((s) => <li key={s}><p>{s}</p></li>)}
        </ol>
      </section>

      <section className="section shell faq" aria-labelledby="faq" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet="G-05" title={g.faqTitle} id="faq" />
        <div style={{ maxWidth: 860 }}>
          {g.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="label" style={{ marginTop: "var(--s-6)", maxWidth: "60em" }}>{g.disclaimer}</p>
      </section>
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Limar Homes", url: href(locale, "/") }, { name: dict.nav.goldenVisa, url: href(locale, "/golden-visa") }]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />
    </>
  );
}
