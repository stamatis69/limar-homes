import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { resolveEnquiryContext } from "@/lib/enquiry/context";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/routes";
import { countryNames } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/enquire">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, path: "/enquire", title: getDictionary(locale).meta.enquireTitle, noindex: true });
}

export default async function EnquirePage({ params, searchParams }: PageProps<"/[locale]/enquire">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const { context, defaultInterest } = resolveEnquiryContext(await searchParams);
  return (
    <section className="shell section--tight" style={{ paddingBottom: "var(--s-9)" }}>
      <div className="split enquiry-layout">
        <div className="stack-4">
          <p className="sheet-no">E-01</p>
          <h1 className="h1">{dict.enquiry.title}</h1>
          <p className="lead">{dict.enquiry.lead}</p>
          <address className="contact-lines" style={{ fontStyle: "normal", marginTop: "var(--s-6)" }}>
            <span className="label">{dict.contact.officeTitle}</span>
            <a href={`tel:${site.phone.tel}`}>{site.phone.display}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span className="muted">{dict.contact.hours}</span>
          </address>
        </div>
        <EnquiryForm
          locale={locale}
          dict={{ enquiry: dict.enquiry, common: dict.common, status: dict.status, pathfinder: dict.pathfinder, footer: dict.footer }}
          context={context}
          defaultInterest={defaultInterest}
          countries={countryNames(locale)}
          contact={{ email: site.email, phone: site.phone.display, whatsapp: site.whatsapp?.wa ?? null }}
        />
      </div>
    </section>
  );
}
