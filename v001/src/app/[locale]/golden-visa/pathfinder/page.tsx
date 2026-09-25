import type { Metadata } from "next";
import Link from "next/link";
import { Pathfinder, type PathfinderDev } from "@/components/golden-visa/Pathfinder";
import { getCatalog, summaries } from "@/data/catalog";
import { getDictionary } from "@/lib/i18n";
import { href, isLocale, type Locale } from "@/lib/i18n/routes";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/golden-visa/pathfinder">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/golden-visa/pathfinder", title: dict.meta.pathfinderTitle, description: dict.meta.pathfinderDescription });
}

export default async function PathfinderPage({ params }: PageProps<"/[locale]/golden-visa/pathfinder">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const mode = getCatalog().mode;
  // Only real developments feed Pathfinder matches, even in fixture mode.
  const devs: PathfinderDev[] = summaries()
    .filter((d) => mode === "canonical" || d.id !== "fixture-stress")
    .map((d) => ({ id: d.id, slug: d.slug, name: d.name, status: d.status, region: d.region, sizeMin: d.sizeMin, sizeMax: d.sizeMax, goldenVisaStatement: d.goldenVisaStatement, available: d.available, locality: d.locality }));
  return (
    <section className="shell section--tight" style={{ paddingBottom: "var(--s-9)" }}>
      <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--s-6)" }}>
        <Link href={href(locale, "/golden-visa")}>{dict.nav.goldenVisa}</Link> <span aria-hidden="true">/</span> <span aria-current="page">{dict.meta.pathfinderTitle}</span>
      </nav>
      <h1 className="visually-hidden">{dict.meta.pathfinderTitle}</h1>
      <Pathfinder locale={locale} dict={{ pathfinder: dict.pathfinder, common: dict.common, status: dict.status }} developments={devs} />
    </section>
  );
}
