import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/routes";
import { countryNames } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: dict.meta.contactTitle, description: dict.meta.contactDescription });
}

export default async function Contact({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.office.street}, ${site.office.postalCode} ${site.office.locality}, Greece`)}`;
  return (
    <section className="shell section--tight" style={{ paddingBottom: "var(--s-9)" }}>
      <div className="split enquiry-layout">
        <div className="stack-5">
          <p className="sheet-no">A-08</p>
          <h1 className="display" style={{ fontSize: "var(--step-5)" }}>{dict.contact.title}</h1>
          <p className="lead">{dict.contact.lead}</p>
          <dl className="facts">
            <dt className="label">{dict.contact.officeTitle}</dt>
            <dd>
              <a href={mapsUrl} target="_blank" rel="noopener">{site.office.street}, {site.office.postalCode} {site.office.locality} ↗</a>
            </dd>
            <dt className="label">{dict.contact.phone}</dt>
            <dd><a href={`tel:${site.phone.tel}`}>{site.phone.display}</a></dd>
            <dt className="label">{dict.contact.email}</dt>
            <dd><a href={`mailto:${site.email}`}>{site.email}</a></dd>
            <dt className="label">—</dt>
            <dd>{dict.contact.hours}</dd>
          </dl>
          <p className="label">{dict.contact.note}</p>
        </div>
        <div className="stack-4">
          <h2 className="h3">{dict.contact.formTitle}</h2>
          <EnquiryForm
            locale={locale}
            dict={{ enquiry: dict.enquiry, common: dict.common, status: dict.status, pathfinder: dict.pathfinder, footer: dict.footer }}
            context={{ development: null, unit: null, compared: [], pathfinder: null, source: "contact" }}
            defaultInterest="general"
            countries={countryNames(locale)}
            contact={{ email: site.email, phone: site.phone.display, whatsapp: site.whatsapp?.wa ?? null }}
          />
        </div>
      </div>
    </section>
  );
}
