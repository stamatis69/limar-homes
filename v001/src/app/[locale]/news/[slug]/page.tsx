import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { articles, getArticle } from "@/data/articles";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, locales, type Locale } from "@/lib/i18n/routes";
import { fill, loc } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return locales.flatMap((locale) => articles.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = getArticle(slug);
  if (!isLocale(locale) || !a) return {};
  return pageMetadata({ locale, path: `/news/${a.slug}`, title: loc(a.title, locale), description: loc(a.summary, locale) });
}

export default async function Article({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const a = getArticle(slug);
  if (!a) notFound();
  const dict = getDictionary(locale);
  const url = href(locale, `/news/${a.slug}`);
  return (
    <article className="shell section--tight" style={{ paddingBottom: "var(--s-9)" }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href={href(locale, "/news")}>{dict.news.title}</Link> <span aria-hidden="true">/</span> <span>{dict.news.categories[a.category]}</span>
      </nav>
      <header className="stack-4" style={{ margin: "var(--s-6) 0 var(--s-7)", maxWidth: "52em" }}>
        <p className="kicker">{dict.news.categories[a.category]} · {loc(a.dateLabel, locale)} · {fill(dict.news.readingTime, { min: a.minutes })}</p>
        <h1 className="h1">{loc(a.title, locale)}</h1>
        <p className="lead">{loc(a.summary, locale)}</p>
      </header>
      <div className="prose" style={{ borderTop: "1px solid var(--ink)", paddingTop: "var(--s-6)" }}>
        {a.body[locale].map((p, i) => <p key={i}>{p}</p>)}
        {a.sources && (
          <>
            <h2>{dict.news.sources}</h2>
            <ul>
              {a.sources.map((s) => <li key={s.url}><a href={s.url} rel="noopener" target="_blank">{s.label}</a></li>)}
            </ul>
          </>
        )}
        {a.category === "golden-visa" && <p className="label">{dict.common.notLegalAdvice}</p>}
      </div>
      <p style={{ marginTop: "var(--s-7)" }}><Link className="link-arrow" href={href(locale, "/news")}>{dict.news.back}</Link></p>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loc(a.title, locale),
          description: loc(a.summary, locale),
          inLanguage: locale,
          ...(a.date && !a.legacySummaryOnly ? { datePublished: a.date } : {}),
          mainEntityOfPage: `${site.url}${url}`,
          publisher: { "@id": `${site.url}/#organization` },
        }}
      />
    </article>
  );
}
