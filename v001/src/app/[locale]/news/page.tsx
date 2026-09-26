import type { Metadata } from "next";
import { InsightsList } from "@/components/news/InsightsList";
import { articles } from "@/data/articles";
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

export default async function News({ params }: PageProps<"/[locale]/news">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const sorted = [...articles].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const cats = ["all", ...new Set(articles.map((a) => a.category))] as Array<keyof typeof dict.news.categories>;
  return (
    <>
      <section className="shell page-head">
        <p className="sheet-no">A-07</p>
        <h1 className="display" style={{ fontSize: "var(--step-5)" }}>{dict.news.title}</h1>
        <p className="lead">{dict.news.lead}</p>
      </section>
      <section className="shell" style={{ paddingBottom: "var(--s-9)" }}>
        <InsightsList
          items={sorted.map((a) => ({
            slug: a.slug,
            href: href(locale, `/news/${a.slug}`),
            category: a.category,
            categoryLabel: dict.news.categories[a.category],
            dateLabel: loc(a.dateLabel, locale),
            title: loc(a.title, locale),
            summary: loc(a.summary, locale),
            readingTime: fill(dict.news.readingTime, { min: a.minutes }),
          }))}
          categories={cats.map((c) => ({ key: c, label: dict.news.categories[c] }))}
          labels={{ filter: dict.news.title, empty: dict.news.empty, read: dict.common.readMore }}
        />
      </section>
    </>
  );
}
