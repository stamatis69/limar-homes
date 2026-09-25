/**
 * Locale-aware routing. English lives at the root (preserving indexed legacy URLs);
 * Greek and Turkish live under /el and /tr with localized path segments.
 * Internally every page is served from /[locale]/<internal segments>.
 */
export const locales = ["en", "el", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** internal segment → public segment per locale */
const segmentMap: Record<string, Record<Locale, string>> = {
  projects: { en: "projects", el: "erga", tr: "projeler" },
  "golden-visa": { en: "golden-visa", el: "golden-visa", tr: "golden-visa" },
  pathfinder: { en: "pathfinder", el: "odigos", tr: "rehber" },
  about: { en: "about", el: "etaireia", tr: "hakkimizda" },
  contact: { en: "contact", el: "epikoinonia", tr: "iletisim" },
  news: { en: "news", el: "nea", tr: "haberler" },
  "privacy-policy": { en: "privacy-policy", el: "aporrito", tr: "gizlilik" },
  compare: { en: "compare", el: "sygkrisi", tr: "karsilastir" },
  enquire: { en: "enquire", el: "aitima", tr: "talep" },
};

const reverseMap: Record<Locale, Record<string, string>> = { en: {}, el: {}, tr: {} };
for (const [internal, byLocale] of Object.entries(segmentMap)) {
  for (const locale of locales) reverseMap[locale][byLocale[locale]] = internal;
}

/** Build a public href for an internal path such as "/projects/terrace-heights". */
export function href(locale: Locale, internalPath: string = "/"): string {
  const [pathPart, query] = internalPath.split("?");
  const segments = (pathPart ?? "/").split("/").filter(Boolean);
  const translated = segments.map((seg) => segmentMap[seg]?.[locale] ?? seg);
  const path = "/" + translated.join("/");
  const prefixed = locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;
  return query ? `${prefixed}?${query}` : prefixed;
}

export type ResolvedPath =
  | { kind: "ok"; locale: Locale; internalPath: string }
  | { kind: "redirect"; to: string };

/**
 * Resolve an incoming public pathname into locale + internal path.
 * Returns a redirect when the URL is a non-canonical spelling (e.g. /en/…, /el/projects/…).
 */
export function resolvePublicPath(pathname: string): ResolvedPath {
  const segments = pathname.split("/").filter(Boolean);
  let locale: Locale = defaultLocale;
  let rest = segments;
  const first = segments[0];
  if (first && isLocale(first)) {
    if (first === defaultLocale) {
      return { kind: "redirect", to: "/" + segments.slice(1).join("/") };
    }
    locale = first;
    rest = segments.slice(1);
  }
  let nonCanonical = false;
  const internal = rest.map((seg) => {
    const mapped = reverseMap[locale][seg];
    if (mapped) return mapped;
    // An internal (English) segment used under a non-English locale → redirect to localized form.
    if (segmentMap[seg] && segmentMap[seg][locale] !== seg) {
      nonCanonical = true;
      return seg;
    }
    return seg;
  });
  const internalPath = "/" + internal.join("/");
  if (nonCanonical) return { kind: "redirect", to: href(locale, internalPath) };
  return { kind: "ok", locale, internalPath };
}

/** Alternate URLs for hreflang, keyed by BCP-47 language tag. */
export function alternates(internalPath: string): Record<string, string> {
  return {
    en: href("en", internalPath),
    el: href("el", internalPath),
    tr: href("tr", internalPath),
    "x-default": href("en", internalPath),
  };
}

/** Legacy URLs → new internal paths (English). See SEO_ROUTE_MAP.md. */
export const legacyRedirects: Array<{ source: string; destination: string }> = [
  { source: "/projects/parkview-residence", destination: "/projects/parkview-residences" },
  { source: "/projects/portside-residence", destination: "/projects/portside-residences" },
];

/** Legacy URLs intentionally removed (served 410 Gone). */
export const goneUrls = ["/nyt-vote"];

export const htmlLang: Record<Locale, string> = { en: "en", el: "el", tr: "tr" };
export const ogLocale: Record<Locale, string> = { en: "en_GB", el: "el_GR", tr: "tr_TR" };
