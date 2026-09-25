import type { Development } from "@/lib/types";
import { site } from "@/lib/site";
import { href, type Locale } from "@/lib/i18n/routes";

/** Client entity: Limar Homes. Merqon is intentionally absent (provenance lives elsewhere). */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    email: site.email,
    sameAs: Object.values(site.social),
    // Address and telephone omitted until confirmed (BUSINESS_DATA_CONFLICTS.md #11–12).
  };
}

/**
 * Residence / place listing for a development. Only verified, non-conflicting fields are emitted:
 * no price, no availability counts, no coordinates, no ratings. Unverified fields are skipped.
 */
export function developmentLd(dev: Development, locale: Locale) {
  const url = `${site.url}${href(locale, `/projects/${dev.slug}`)}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    "@id": `${url}#place`,
    name: dev.name,
    url,
    description: dev.copy.tagline[locale],
    address: {
      "@type": "PostalAddress",
      streetAddress: dev.address.street,
      addressLocality: dev.address.locality,
      ...(dev.address.postalCode ? { postalCode: dev.address.postalCode } : {}),
      addressCountry: "GR",
    },
    containedInPlace: { "@type": "City", name: dev.city.en },
  };
  if (dev.unitsTotal != null && !dev.unverified.includes("unitsTotal")) ld.numberOfAccommodationUnits = dev.unitsTotal;
  if (dev.amenities.includes("pool")) ld.amenityFeature = [{ "@type": "LocationFeatureSpecification", name: "Pool", value: true }];
  return ld;
}

export function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${site.url}${it.url}` })),
  };
}
