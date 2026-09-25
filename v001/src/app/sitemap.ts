import type { MetadataRoute } from "next";
import { developments } from "@/data/developments";
import { articles } from "@/data/articles";
import { alternates, href, locales } from "@/lib/i18n/routes";
import { site } from "@/lib/site";

/** Localized sitemap with hreflang alternates. Noindex pages (compare, enquire) are excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/projects",
    ...developments.map((d) => `/projects/${d.slug}`),
    "/golden-visa",
    "/golden-visa/pathfinder",
    "/about",
    "/contact",
    "/news",
    ...articles.map((a) => `/news/${a.slug}`),
    "/privacy-policy",
  ];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}${href(locale, path)}`,
      alternates: {
        languages: Object.fromEntries(Object.entries(alternates(path)).map(([k, v]) => [k, `${site.url}${v}`])),
      },
      changeFrequency: path.startsWith("/projects/") ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : path.startsWith("/projects") ? 0.9 : 0.6,
    })),
  );
}
