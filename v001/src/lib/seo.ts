import type { Metadata } from "next";
import { alternates, href, ogLocale, type Locale } from "@/lib/i18n/routes";
import { site } from "@/lib/site";
import { getDictionary } from "@/lib/i18n";

export function pageMetadata(opts: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  noindex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const dict = getDictionary(opts.locale);
  const canonical = href(opts.locale, opts.path);
  const alts = alternates(opts.path);
  const description = opts.description ?? dict.meta.homeDescription;
  const title = opts.absoluteTitle ? opts.title : `${opts.title} · ${dict.meta.siteName}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages: alts },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: dict.meta.siteName,
      title,
      description,
      url: canonical,
      locale: ogLocale[opts.locale],
      alternateLocale: Object.values(ogLocale).filter((l) => l !== ogLocale[opts.locale]),
      images: [{ url: href(opts.locale, "/opengraph-image"), width: 1200, height: 630, alt: dict.meta.siteName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [href(opts.locale, "/opengraph-image")] },
  };
}

export const metadataBase = new URL(site.url);
