import type { Metadata } from "next";
import Link from "next/link";
import { Elevation } from "@/components/Elevation";
import { ChapterHead, StateMark } from "@/components/ui";
import { getCatalog } from "@/data/catalog";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { loc } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/about", title: dict.meta.aboutTitle, description: dict.meta.aboutDescription });
}

export default async function About({ params }: PageProps<"/[locale]/about">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const devs = getCatalog().developments.filter((d) => d.id !== "fixture-stress");
  return (
    <>
      <section className="shell page-head">
        <p className="kicker">{dict.nav.about}</p>
        <h1 className="display" style={{ fontSize: "var(--step-5)", maxWidth: "12em" }}>{dict.about.title}</h1>
        <p className="lead">{dict.about.lead}</p>
        <p className="body">{dict.about.experience}</p>
      </section>
      <section className="section--tight shell" aria-labelledby="practice">
        <ChapterHead sheet="B-01" title={dict.home.practiceTitle} id="practice" />
        <div className="practice">
          {dict.home.practice.map((p) => (
            <div key={p.title}>
              <h3>{p.title}</h3>
              <p className="muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section shell" aria-labelledby="portfolio">
        <ChapterHead sheet="B-02" title={dict.about.portfolioTitle} id="portfolio" />
        <div className="ledger-list">
          {devs.map((d) => (
            <Link key={d.id} href={href(locale, `/projects/${d.slug}`)} className="ledger-row">
              <span className="sheet-no">{d.sheet}</span>
              <span className="ledger-name">{d.name}</span>
              <span className="ledger-meta muted">{loc(d.locality, locale)} · {loc(d.completion.label, locale)}</span>
              <span className="ledger-status"><StateMark status={d.status} label={dict.status[d.status]} /></span>
              <span className="ledger-thumb" aria-hidden="true"><Elevation spec={d.drawing} title={d.name} animate={false} compact /></span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section shell" aria-labelledby="team" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet="B-03" title={dict.about.teamTitle} id="team" />
        <div className="pending-slot"><p>{dict.about.teamPending}</p></div>
      </section>
      <section className="section shell" aria-labelledby="recognition" style={{ borderTop: "1px solid var(--line)" }}>
        <ChapterHead sheet="B-04" title={dict.about.recognitionTitle} id="recognition" lead={dict.about.recognitionNote} />
        <ul className="spec-list plain-list" style={{ gridTemplateColumns: "1fr" }}>
          <li><Link href={href(locale, site.recognition[0].href)}>{dict.home.recognitionLLA}</Link></li>
          <li>{dict.about.aetoi}</li>
        </ul>
      </section>
    </>
  );
}
