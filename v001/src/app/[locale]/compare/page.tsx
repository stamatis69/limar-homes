import type { Metadata } from "next";
import { ComparePage } from "@/components/compare/ComparePage";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/routes";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/compare">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, path: "/compare", title: getDictionary(locale).meta.compareTitle, noindex: true });
}

export default async function Compare({ params }: PageProps<"/[locale]/compare">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return (
    <>
      <section className="shell page-head">
        <p className="sheet-no">C-01</p>
        <h1 className="h1">{dict.compare.title}</h1>
        <p className="lead">{dict.compare.lead}</p>
      </section>
      <section className="shell" style={{ paddingBottom: "var(--s-9)" }}>
        <ComparePage locale={locale} dict={{ compare: dict.compare, explorer: dict.explorer, status: dict.status, common: dict.common, development: dict.development, amenities: dict.amenities }} />
      </section>
    </>
  );
}
