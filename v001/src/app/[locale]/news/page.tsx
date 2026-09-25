import type { Metadata } from "next";
import Link from "next/link";
import { articles, type ArticleCategory } from "@/data/articles";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { fill, loc } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/news", title: dict.meta.newsTitle, description: dict.meta.newsDescription });
}

export default async function News({ params, searchParams }: PageProps<"/[locale]/news">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const cat = (await searchParams).category;
  const active = (typeof cat === "string" && cat in dict.news.categories ? cat : "all") as ArticleCategory | "all";
  const sorted = [...articles].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const shown = active === "all" ? sorted : sorted.filter((a) => a.category === active);
  const [lead, ...rest] = shown;
  const cats = (["all", ...new Set(articles.map((a) => a.category))] as Array<ArticleCategory | "all">);
  return (
    <>
      <section className="shell page-head">
        <p className="sheet-no">A-07</p>
        <h1 className="display" style={{ fontSize: "var(--step-5)" }}>{dict.news.title}</h1>
        <p className="lead">{dict.news.lead}</p>
        <nav className="filters" aria-label={dict.news.title}>
          {cats.map((c) => (
            <Link key={c} className="chip" href={href(locale, c === "all" ? "/news" : `/news?category=${c}`)} aria-current={active === c ? "page" : undefined}>
              <span style={active === c ? { background: "var(--ink)", color: "var(--paper)" } : undefined}>{dict.news.categories[c]}</span>
            </Link>
          ))}
        </nav>
      </section>
      <section className="shell" style={{ paddingBottom: "var(--s-9)" }}>
        {!lead ? (
          <p className="muted">{dict.news.empty}</p>
        ) : (
          <>
            <Link href={href(locale, `/news/${lead.slug}`)} className="feature" style={{ textDecoration: "none", borderTop: "1px solid var(--ink)", paddingTop: "var(--s-5)", marginBottom: "var(--s-7)" }}>
              <div className="stack-4">
                <span className="kicker">{dict.news.categories[lead.category]} · {loc(lead.dateLabel, locale)}</span>
                <h2 className="h1">{loc(lead.title, locale)}</h2>
              </div>
              <div className="stack-4">
                <p className="lead">{loc(lead.summary, locale)}</p>
                <span className="link-arrow" style={{ width: "fit-content" }}>{dict.common.readMore}</span>
              </div>
            </Link>
            <div className="articles">
              {rest.map((a) => (
                <Link key={a.slug} href={href(locale, `/news/${a.slug}`)} className="article-item">
                  <span className="kicker">{dict.news.categories[a.category]} · {loc(a.dateLabel, locale)}</span>
                  <h3>{loc(a.title, locale)}</h3>
                  <p className="muted">{loc(a.summary, locale)}</p>
                  <span className="label">{fill(dict.news.readingTime, { min: a.minutes })}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
