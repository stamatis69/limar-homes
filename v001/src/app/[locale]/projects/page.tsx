import type { Metadata } from "next";
import { DevelopmentIndex, type IndexEntry } from "@/components/projects/DevelopmentIndex";
import { JsonLd } from "@/components/JsonLd";
import { availableCount, getCatalog } from "@/data/catalog";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[locale]/projects">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/projects", title: dict.meta.projectsTitle, description: dict.meta.projectsDescription });
}

export default async function ProjectsPage({ params }: PageProps<"/[locale]/projects">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const entries: IndexEntry[] = getCatalog().developments.map((d) => ({ dev: d, available: availableCount(d) }));
  return (
    <>
      <section className="shell page-head">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a href={href(locale, "/")}>Limar Homes</a> <span aria-hidden="true">/</span> <span aria-current="page">{dict.projects.title}</span>
        </nav>
        <h1 className="display" style={{ fontSize: "var(--step-5)" }}>{dict.projects.title}</h1>
        <p className="lead">{dict.projects.lead}</p>
      </section>
      <section className="shell" style={{ paddingBottom: "var(--s-9)" }}>
        <DevelopmentIndex locale={locale} entries={entries} dict={{ projects: dict.projects, common: dict.common, status: dict.status }} />
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Limar Homes", url: href(locale, "/") }, { name: dict.projects.title, url: href(locale, "/projects") }])} />
    </>
  );
}
