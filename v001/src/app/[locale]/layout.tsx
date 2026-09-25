import "@fontsource-variable/noto-serif-display";
import "@fontsource-variable/commissioner";
import "@fontsource-variable/jetbrains-mono";
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Dock } from "@/components/chrome/Dock";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/data/catalog";
import { getDictionary } from "@/lib/i18n";
import { htmlLang, isLocale, locales } from "@/lib/i18n/routes";
import { merqonSignature, provenanceEnabled } from "@/lib/merqon";
import { metadataBase } from "@/lib/seo";
import { organizationLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1ece3",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const other: Record<string, string> = {};
  if (provenanceEnabled && merqonSignature.siteId) {
    other["merqon:site-id"] = merqonSignature.siteId;
    other["merqon:provider"] = merqonSignature.provider.name;
    other["merqon:designed-by"] = merqonSignature.provider.name;
    other["merqon:developed-by"] = merqonSignature.provider.name;
  }
  return {
    metadataBase,
    applicationName: "Limar Homes",
    formatDetection: { telephone: false, email: false, address: false },
    other,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const catalog = getCatalog();
  const footerDevs = catalog.developments.filter((d) => d.id !== "fixture-stress").map((d) => ({ slug: d.slug, name: d.name }));

  return (
    <html lang={htmlLang[locale]}>
      <body>
        <a className="skip-link" href="#main">
          {dict.nav.skip}
        </a>
        {catalog.mode === "fixture" && (
          <div className="fixture-banner" role="note">
            {dict.fixture.banner}
          </div>
        )}
        <Header locale={locale} dict={dict} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} dict={dict} developments={footerDevs} />
        <Dock
          locale={locale}
          labels={{
            consent: dict.consent,
            compare: dict.compare,
            remove: dict.common.remove,
            enquire: dict.common.requestInformation,
            privacy: dict.footer.privacy,
          }}
        />
        <JsonLd data={organizationLd()} />
      </body>
    </html>
  );
}
