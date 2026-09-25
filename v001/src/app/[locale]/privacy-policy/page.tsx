import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/routes";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy-policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, path: "/privacy-policy", title: getDictionary(locale).meta.privacyTitle });
}

/**
 * Describes what THIS website actually does with data. Controller details and retention periods
 * must be completed by Limar's counsel; the live site's existing policy text should be migrated
 * and reconciled (it could not be retrieved from the build environment).
 */
export default async function Privacy({ params }: PageProps<"/[locale]/privacy-policy">) {
  const locale = (await params).locale as Locale;
  const dict = getDictionary(locale);
  return (
    <section className="shell section--tight" style={{ paddingBottom: "var(--s-9)" }}>
      <h1 className="h1">{dict.meta.privacyTitle}</h1>
      <p className="notice" style={{ marginTop: "var(--s-5)" }}>{dict.privacy.draftNotice}</p>
      <div className="prose" style={{ marginTop: "var(--s-6)" }} lang="en">
        <h2>Who we are</h2>
        <p>{site.name}, {site.office.street}, {site.office.postalCode} {site.office.locality}, Greece. Contact: <a href={`mailto:${site.email}`}>{site.email}</a>. [Legal entity name, GEMI number and data-protection contact to be completed by Limar.]</p>
        <h2>Enquiries</h2>
        <p>When you send an enquiry we process your name, email, optional phone number, country, preferred language and contact method, your message, and the property context you selected (development, residence, compared residences, Golden Visa Pathfinder outcome). We use it only to answer your enquiry and take pre-contractual steps you ask for (legal basis: Art. 6(1)(b) GDPR and our legitimate interest in responding, Art. 6(1)(f)). Marketing emails are sent only if you tick the optional box (Art. 6(1)(a)); you can withdraw at any time.</p>
        <h2>What stays in your browser</h2>
        <p>Your language, comparison shortlist (residence IDs only), Pathfinder answers (for this visit only) and your cookie choice are stored in your browser. They contain no contact details and are not sent to us unless you submit an enquiry.</p>
        <h2>Measurement</h2>
        <p>Anonymous usage measurement runs only if you choose “Allow measurement”. It never includes your name, email, phone or message. You can change your choice via “Cookie settings” in the footer.</p>
        <h2>Retention and your rights</h2>
        <p>[Retention periods to be completed by Limar.] You may request access, rectification, erasure, restriction, portability or object to processing by emailing {site.email}. You may complain to the Hellenic Data Protection Authority (www.dpa.gr).</p>
      </div>
    </section>
  );
}
